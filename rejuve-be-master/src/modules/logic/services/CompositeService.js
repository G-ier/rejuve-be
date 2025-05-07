const UserRepository = require('../repositories/userRepository');
const ClientRepository = require('../repositories/clientRepository');
const orderRepository = require('../repositories/orderRepository');
const shippingAddressRepository = require('../repositories/shippingAddressRepository');

const HealthieUserService = require('./healthie/healthieUserService');
const HealthieClientService = require('./healthie/healthieClientService');
const HealthieOfferingsService = require('./healthie/healthieOfferingsService');
const HealthieOrderService = require('./healthie/healthieOrderService');
const FormService = require('./openloop/formService');
const { v4: uuidv4 } = require('uuid');

class CompositeService {
  constructor() {
    this.userRepository = new UserRepository();
    this.clientRepository = new ClientRepository();
    this.healthieClientService = new HealthieClientService();
    this.formService = new FormService();
  }

  // ==================== CLIENT SERVICE METHODS ====================
  async createClient(first_name, last_name, email, phone_number, user_group_id, additional_record_identifier, platformUser) {
    try {
      const userData = {
        first_name,
        last_name,
        email,
        phone_number,
        user_group_id,
        additional_record_identifier
      }
      const response = await this.healthieClientService.createClient({ ...userData});
      userData.client_id = response.user.id;
      // Insert to database without fail mechanism
      await this.clientRepository.createClient(userData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateClient(id, client_id, userData) {
    const updatedUser = await this.userRepository.updateUser(id, userData);

    try {
      await this.healthieClientService.updateClientInHealthie(client_id, userData);
    } catch (error) {
      throw error;
    }

    return updatedUser;
  }

  async retrieveUserGroups(offset = 1) {
    return this.healthieClientService.retrieveUserGroups(offset);
  }

  // ==================== FORMS SERVICE METHODS ====================
  // ALIST
  async uploadFormAnswers(answers) {
    try {
      return this.formService.uploadFormAnswers(answers);
    } catch (error) {
      throw error;
    }
  }

  // ==================== OFFERINGS SERVICE METHODS ====================
  async getOfferingsWrapper(options = {}) {
    try {
      const offerings = await HealthieOfferingsService.getOfferings(options); 

      const mappedOfferings = offerings.map(offering => ({
        id: offering.id,
        name: offering.name,
        billingFrequency: offering.billing_frequency,
        currency: offering.currency,
        price: offering.price,
        initialPaymentAmount: offering.initial_payment_amount,
        initialPriceWithTaxes: offering.initial_price_with_taxes
      }));

      return mappedOfferings;
    } catch (error) {
      throw error;
    }
  }

  async storeCard(params) {
    if (!params.user_id || !params.token) {
      throw new Error('user_id and token are required');
    }
    const result = await HealthieOfferingsService.storeCardInHealthie(params);
    return result.stripe_customer_detail.id;
  }

  async getPaymentCards(params) {
    if (!params.user_id) {
      throw new Error('user_id is required');
    }
    const result = await HealthieOfferingsService.getPaymentCardsFromHealthie({ user_id: params.user_id });
    return result; 
  }

  async subscribeToPlan({ userId, offeringId, amount, stripeCustomerDetailId, requestedPaymentId, senderId }) {
    if (!userId || !amount || !offeringId || !stripeCustomerDetailId) {
      throw new Error('Missing required parameters');
    }
    // Generate a unique idempotency key for Stripe.
    const idempotencyKey = uuidv4();

    // Charge the patient by creating a Billing Item in Healthie.
    const billingItemId = await HealthieOfferingsService.chargePatientInHealthie({
      amountPaid: amount.toString(),
      senderId: senderId || userId,
      requestedPaymentId: requestedPaymentId || null,
      stripeIdempotencyKey: idempotencyKey,
      stripeCustomerDetailId,
      offering_id: offeringId,
      shouldCharge: true
    });

    // Create an invoice in Healthie to record the subscription.
    const invoice = await HealthieOfferingsService.createInvoice({
      user_id: userId,
      offering_id: offeringId,
      amount: amount.toString()
    });

    return { billingItemId, invoice };
  }

  async getUserPackageSelections(params) {
    if (!params.user_id) {
      throw new Error('user_id is required');
    }
  
    const result = await HealthieOfferingsService.getUserPackageSelections({
      offering_id: params.offering_id || null, // Optional parameter
      user_id: params.user_id,
      offset: params.offset || 0 // Default offset to 0 if not provided
    });

    return {
      count: result.userPackageSelectionsCount,
      selections: result.userPackageSelections
    };
  }

  // ==================== ORDER SERVICE METHODS ====================
  async getOrdersByPatientId(userId) {
    if (!userId) {
      throw new Error('Patient ID is required');
    }
    try {
      const orders = await orderRepository.getOrdersByPatientId(userId);
      for (let order of orders) {
        if (order.shipping_address_id) {
          // Get the shipping address by its ID
          const address = await shippingAddressRepository.getAddressesByPatientId(order.shipping_address_id);
          
          // Attach the address to the order
          order.shipping_address = address;
        }
      }
      return orders;
    } catch (error) {
      throw error;
    }
  }

  async createOrder(orderData) {
    if (!orderData) {
      throw new Error('Patient ID and order data are required');
    }
    try {
      // Create order using openLoop api
      const newOrder = await orderRepository.create(orderData);
      return newOrder;
    } catch (error) {
      throw error;
    }
  }

  async createAddress(addressData) {
    // Validate required fields
    const requiredFields = [
      'user_id',
      'first_name',
      'last_name',
      'street_address',
      'city',
      'state',
      'phone',
      'zip',
      'country'
    ];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const newAddress = await shippingAddressRepository.createAddress(addressData);
    return newAddress;
  }

  // ==================== USER SERVICE METHODS ====================
  async getUserById(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const dbUser = await this.userRepository.getUserById(userId);
    return dbUser;
  }

  async getUserByClientId(clientId) {
    if (!clientId) {
      throw new Error('Client id is required');
    }
    const user = await HealthieUserService.getUserFromHealthie(clientId);
    return user;
  }

  async createEntry(entryData) {
    try {
      const newEntry = await HealthieUserService.createEntryInHealthie(entryData);
      return newEntry;
    } catch (error) {
      console.error('Error in service while creating patient metric entry:', error);
      throw error;
    }
  }

  async checkEligibility(id) {
    try {
      const response = await HealthieUserService.getUserFromHealthie(id);
      const user = response;
      return this.isEligible(user);
    } catch (error) {
      console.error('Error checking eligibility:', error.message);
      throw error;
    }
  }

  isEligible(userData) {
    if (!userData.dob) {
      return false;
    }
    const age = this.getAgeFromBirthday(userData.dob);
    if (age < 18 || age > 74) {
      return false;
    }

    const bmi = this.calculateBMI(userData.height, userData.weight.split(" ")[0]);
       
    const eligible = bmi < 27;
    if (!eligible) {
      return false;
    }

    return true;
  }

  getAgeFromBirthday(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  calculateBMI(height, weightValue) {
    // Convert weightValue to a number (assuming it's a string, e.g., "200")
    const weight = parseFloat(weightValue);
    if (!height || isNaN(weight)) {
      return null;
    }
    // BMI formula for imperial units: (weight in lbs * 703) / (height in inches)^2
    const bmi = (weight * 703) / (height * height);
    return bmi;
  }

  // ==================== FLOW SERVICE METHODS ====================
  async completeQuestionnaire(first_name, 
    last_name, 
    email, 
    phone_number, 
    user_group_id, 
    additional_record_identifier, 
    answers,
    platformUser
  ) {
    try {
      // Create client in Healthie
      const client = await this.createClient(first_name, last_name, email, phone_number, user_group_id, additional_record_identifier, platformUser);
      if (!client) {
        throw new Error('Failed to create client in Healthie');
      }
      // Upload form answers to OpenLoop
      answers.patient_id = client.user.id;
      const formAnswers = await this.uploadFormAnswers(answers);
      if (!formAnswers) {
        throw new Error('Failed to upload form answers to OpenLoop');
      }
      return formAnswers;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CompositeService; 