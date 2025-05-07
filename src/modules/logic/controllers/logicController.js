const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const { ClientLogger } = require('../../../shared/lib/WinstonLogger');
// The programs module is missing
// const preQuestionnaireService = require('../../programs/services/preQuestionnaireService');

// Import the CompositeService instead of individual services
const CompositeService = require('../services/CompositeService');

class LogicController {
  constructor(services = {}) {
    // Initialize the CompositeService
    this.compositeService = new CompositeService();
    this.logger = ClientLogger;
  }

  // Common utility function for all controllers
  async extractRequestDataWithUser(req) {
    try {
      const user = req.user;
      let { platformUser, ...otherParams } = req.method === 'POST' ? req.body : req.query;
      if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== 'true') {
        if (!user) {
          throw new Error('User information not available in the request');
        }

        // Check if the user has 'admin' permission
        const isAdmin = user.roles && user.roles.includes('admin');
        // If the user is not an admin, enforce platformUser to be the user's ID
        if (!isAdmin) {
          platformUser = user.id;
        }
      }
      return { ...otherParams, platformUser, user };
    } catch (e) {
      logger.error(`Error in extracting user: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  // ==================== ORDER CONTROLLER FUNCTIONS ====================
  async listOrdersByPatient(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      const orders = await this.compositeService.getOrdersByPatientId(userId);
      return res.status(200).json({ orders });
    } catch (error) {
      this.logger.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'An unexpected error occurred while fetching orders' });
    }
  }

  async createOrder(req, res) {
    try {
      const orderData = req.body;
      if (!orderData) {
        return res.status(400).json({ error: 'Patient ID and order data are required' });
      }
      const newOrder = await this.compositeService.createOrder(orderData);
      return res.status(201).json(newOrder);
    } catch (error) {
      this.logger.error('Error creating order:', error);
      return res.status(500).json({ error: 'An unexpected error occurred while creating the order' });
    }
  }

  async createAddress(req, res) {
    try {
      const addressData = req.body;
  
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
          return res.status(400).json({ error: `${field} is required` });
        }
      }
 
      const newAddress = await this.compositeService.createAddress(addressData);

      return res.status(201).json({ newAddress });
    } catch (error) {
      this.logger.error('Error creating address:', error);
      return res.status(500).json({ error: 'An unexpected error occurred while creating the address' });
    }
  }

  // ==================== OFFERINGS CONTROLLER FUNCTIONS ====================
  async listOfferings(req, res) {
    try {
      const {offset, should_paginate, keywords, platformUser} = await this.extractRequestDataWithUser(req);
      
      const options = {
        offset: offset ? parseInt(offset) : 0,
        should_paginate: should_paginate !== 'false',
        keywords: keywords || null,
      };
      const offerings = await this.compositeService.getOfferingsWrapper(options);
      res.status(200).json({ offerings });
    } catch (error) {
      this.logger.error('Error listing offerings:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  async storeCard(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { token, cardTypeLabel, userId, isDefault } = params;

      const existingUser = await this.compositeService.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const stripeCustomerDetailId = await this.compositeService.storeCard({
        token,
        cardTypeLabel,
        user_id : existingUser.client_id,
        isDefault
      });
      res.status(200).json({ stripeCustomerDetailId });
    } catch (error) {
      this.logger.error('Error storing card:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }
  
  async subscribeToPlan(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { userId, offeringId, amount, stripeCustomerDetailId, requestedPaymentId, senderId } = params;

      const existingUser = await this.compositeService.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const result = await this.compositeService.subscribeToPlan({ 
        userId : existingUser.client_id, 
        offeringId, 
        amount, 
        stripeCustomerDetailId, 
        requestedPaymentId, 
        senderId 
      });
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error subscribing to plan:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  async getPaymentCards(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { userId } = params;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
 
      const existingUser = await this.compositeService.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const cards = await this.compositeService.getPaymentCards({
        user_id: existingUser.client_id
      });
  
      res.status(200).json({ cards });
    } catch (error) {
      this.logger.error('Error getting payment cards:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  async getUserPackageSelections(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { userId, offset } = params;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
 
      const existingUser = await this.compositeService.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const result = await this.compositeService.getUserPackageSelections({
        offering_id: null,
        user_id: existingUser.client_id,
        offset: offset || 0
      });
  
      res.status(200).json(result); 
    } catch (error) {
      this.logger.error('Error getting user package selections:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  // ==================== CLIENTS CONTROLLER FUNCTIONS ====================
  async createClient(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { 
        platformUser, 
        first_name, 
        last_name, 
        email, 
        phone_number, 
        user_group_id, 
        additional_record_identifier 
      } = params;
      
      const newClient = await this.compositeService.createClient(
        first_name || (email ? email.split('@')[0] : null),
        last_name || (email ? email.split('@')[0] : null),
        email,
        phone_number,
        user_group_id || "",
        additional_record_identifier || "",
        platformUser
      );
      
      res.status(200).json(newClient);
    } catch (error) {
      this.logger.error('Error creating client:', error);
      res.status(500).json({ explanations: error.message || 'An unexpected error occurred while creating the client', errors: error.errors || []});
    }
  }

  async retrieveUserGroups(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { offset, platformUser } = params;

      const userGroups = await this.compositeService.retrieveUserGroups(offset ? parseInt(offset, 10) : 1, platformUser);
      res.status(200).json(userGroups);
    } catch (error) {
      this.logger.error('Error retrieving user groups:', error);
      res.status(500).json({ explanations: error.message || 'An unexpected error occurred while creating the client', errors: error.errors || []});
    }
  }

  // ==================== FORMS CONTROLLER FUNCTIONS ====================
  async uploadFormAnswers(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const { platformUser, answers } = params;
      
      // Validate that answers exists and is not empty
      if (!answers) {
        return res.status(400).json({ error: 'Form answers are required' });
      }

      const result = await this.compositeService.uploadFormAnswers(answers);
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error retrieving all forms:', error);
      res.status(500).json({ explanations: error.message || 'An unexpected error occurred while retrieving all forms', errors: error.errors || []});
    }
  }
  

  // ==================== USERS CONTROLLER FUNCTIONS ====================
  async createEntry(req, res) {
    try {
      const { metric_stat, category, type, user_id, created_at } = req.body;
      const existingUser = await this.compositeService.getUserById(user_id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const client_id = existingUser.client_id;
      const result = await this.compositeService.createEntry({
        metric_stat,
        category,
        type,
        user_id: client_id,
        created_at,
      });

      res.status(201).json({
        message: 'Patient metrics entry created successfully',
        entry: result.entry,
        messages: result.messages,
      });
    } catch (error) {
      this.logger.error('Error creating entry:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  async checkEligibility(req, res) {
    try {
      const { id } = req.params;
    
      const existingUser = await this.compositeService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const evaluatedUsers = await this.compositeService.checkEligibility(existingUser.client_id);
  
      res.status(200).json(evaluatedUsers);
    } catch (error) {
      this.logger.error('Error checking eligibility:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  async getForms(req, res) {
    try {
      const {platformUser} = await this.extractRequestDataWithUser(req);
      const user = await this.compositeService.getUserByClientId(platformUser);
      res.status(200).json(user);
    } catch (error) {
      this.logger.error('Error getting forms:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }

  // ==================== FLOW CONTROLLER FUNCTIONS ====================
  async completeQuestionnaire(req, res) {
    try {
      const params = await this.extractRequestDataWithUser(req);
      const {
        first_name, 
        last_name, 
        email, 
        phone_number, 
        user_group_id, 
        additional_record_identifier, 
        answers,
        platformUser
      } = params;

      // Validate that answers exists and is not empty
      if (!answers) {
        return res.status(400).json({ error: 'Form answers are required' });
      }

      const result = await this.compositeService.completeQuestionnaire(
        first_name, 
        last_name, 
        email, 
        phone_number, 
        user_group_id, 
        additional_record_identifier, 
        answers,
        platformUser
      );
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error completing questionnaire:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }
}

module.exports = LogicController;