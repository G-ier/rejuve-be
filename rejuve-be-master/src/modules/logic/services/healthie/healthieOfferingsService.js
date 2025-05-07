const axios = require('axios');
const healthieAPI = require('../../../../config/healthie'); 

class HealthieOfferingsService {
  async getOfferings({
    offset = 0,
    should_paginate = true,
    keywords = null,
    sort_by = null,
    provider_id = null,
    offering_id = null,
    offering_ids = null,
    only_client_visible = null,
    status = null,
    client_visibility = null,
    offering_user_group_id = null,
    show_only_visible = null
  } = {}) {
    try {
      const query = `
        query getOfferings(
          $offset: Int,
          $should_paginate: Boolean,
          $keywords: String,
          $sort_by: String,
          $provider_id: ID,
          $offering_id: ID,
          $offering_ids: [ID],
          $only_client_visible: Boolean,
          $status: String,
          $client_visibility: String,
          $offering_user_group_id: ID,
          $show_only_visible: Boolean
        ) {
          offerings(
            offset: $offset,
            should_paginate: $should_paginate,
            keywords: $keywords,
            sort_by: $sort_by,
            provider_id: $provider_id,
            offering_id: $offering_id,
            offering_ids: $offering_ids,
            only_client_visible: $only_client_visible,
            status: $status,
            client_visibility: $client_visibility,
            offering_user_group_id: $offering_user_group_id,
            show_only_visible: $show_only_visible
          ) {
            id
            name
            billing_frequency
            currency
            price
            initial_payment_amount
            initial_price_with_taxes
          }
        }
      `;

      const variables = {
        offset,
        should_paginate,
        keywords,
        sort_by,
        provider_id,
        offering_id,
        offering_ids,
        only_client_visible,
        status,
        client_visibility,
        offering_user_group_id,
        show_only_visible
      };

      const response = await healthieAPI.post('', { query, variables });

      const offerings = response.data?.data?.offerings;
      if (!offerings) {
        throw new Error('No offerings returned from Healthie');
      }

      return offerings;
    } catch (error) {
      if (error.response) {
        const message = error.response.data?.errors?.[0]?.message || 'Failed to retrieve offerings';
        throw new Error(message);
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async storeCardInHealthie({ token, card_type_label = 'personal', user_id, is_default }) {
    try {
      const query = `
        mutation createStripeCustomerDetail(
          $token: String,
          $card_type_label: String,
          $user_id: ID,
          $is_default: Boolean
        ) {
          createStripeCustomerDetail(
            input: {
              token: $token,
              card_type_label: $card_type_label,
              user_id: $user_id,
              is_default: $is_default
            }
          ) {
            stripe_customer_detail {
              id
            }
            messages {
              field
              message
            }
          }
        }
      `;
      const variables = { token, card_type_label, user_id, is_default };
  
      const response = await healthieAPI.post('', { query, variables });
      
      // Check for errors in the response
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      const result = response.data.data.createStripeCustomerDetail;
      return result; // Contains stripe_customer_detail.id and messages if any.
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async chargePatientInHealthie({ 
    amountPaid, 
    senderId, 
    requestedPaymentId, 
    stripeIdempotencyKey, 
    stripeCustomerDetailId,
    offering_id,
    shouldCharge 
  }) {
    try {
      const query = `
        mutation createBillingItem(
          $amount_paid: String,
          $sender_id: ID,
          $requested_payment_id: ID,
          $stripe_idempotency_key: String,
          $stripe_customer_detail_id: ID,
          $offering_id: ID,
          $should_charge: Boolean
        ) {
          createBillingItem(input: {
            amount_paid: $amount_paid,
            sender_id: $sender_id,
            requested_payment_id: $requested_payment_id,
            stripe_idempotency_key: $stripe_idempotency_key,
            stripe_customer_detail_id: $stripe_customer_detail_id,
            offering_id: $offering_id,
            should_charge: $should_charge
          }) {
            billingItem {
              id
            }
            messages {
              field
              message
            }
          }
        }
      `;
      const variables = { 
        amount_paid: amountPaid, 
        sender_id: senderId, 
        requested_payment_id: requestedPaymentId,
        stripe_idempotency_key: stripeIdempotencyKey, 
        stripe_customer_detail_id: stripeCustomerDetailId,
        offering_id,
        should_charge: shouldCharge 
      };
  
      const response = await healthieAPI.post('', { query, variables });
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data.createBillingItem.billingItem.id;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async createInvoice({ recipient_id, offering_id, price, invoice_type }) {
    try {
      const query = `
        mutation createRequestedPayment(
          $recipient_id: ID,
          $offering_id: ID,
          $price: String,
          $invoice_type: String
        ) {
          createRequestedPayment(input: {
            recipient_id: $recipient_id,
            offering_id: $offering_id,
            price: $price,
            invoice_type: $invoice_type
          }) {
            requestedPayment {
              id
            }
            messages {
              field
              message
            }
          }
        }
      `;
      const variables = { recipient_id, offering_id, price, invoice_type };
  
      const response = await healthieAPI.post('', { query, variables });
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data.createRequestedPayment.requestedPayment;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async getPaymentCardsFromHealthie({ user_id }) {
    try {
      const query = `
        query getStripeCustomerDetails($user_id: ID!) {
          stripeCustomerDetails(user_id: $user_id) {
            id
            last4
            exp_month
            exp_year
            brand
            is_default
          }
        }
      `;
      const variables = { user_id };
  
      const response = await healthieAPI.post('', { query, variables });
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data.data.stripeCustomerDetails;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async getUserPackageSelections({ offering_id = null, user_id, offset = null }) {
    try {
      const query = `
        query getUserPackageSelections(
          $offering_id: ID, 
          $user_id: ID!, 
          $offset: Int
        ) {
          userPackageSelectionsCount(
            offering_id: $offering_id, 
            user_id: $user_id
          )
          userPackageSelections(
            offering_id: $offering_id, 
            user_id: $user_id, 
            offset: $offset
          ) {
            id
            status
            offering {
              id
              name
              description
              price
              billing_frequency
            }
            created_at
            updated_at
          }
        }
      `;
      const variables = { offering_id, user_id, offset };
  
      const response = await healthieAPI.post('', { query, variables });
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return {
        userPackageSelectionsCount: response.data.data.userPackageSelectionsCount,
        userPackageSelections: response.data.data.userPackageSelections
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }
}

module.exports = new HealthieOfferingsService(); 