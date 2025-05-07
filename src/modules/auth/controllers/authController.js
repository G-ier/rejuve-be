
const AuthService = require('../services/authService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const ClientLogger = require('../../../shared/lib/WinstonLogger');

class AuthController {

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.logger = ClientLogger;
  }

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
      this.logger.error(`Error in extracting user: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  /*
  async login(req, res, next) {
    try {
      // Validate input
     // validateLogin(req.body);

      const { email, password } = req.body;
      const authResponse = await this.authService.login(email, password);

      // Respond with Auth0 token
      res.json({ access_token: authResponse.token });
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(ApiError.internal('An unexpected error occurred'));
    }
  }

  async getMe(req, res, next) {
    try {
      const auth0Id = req.user.sub;
      const [provider, userId] = auth0Id.split('|');
      if (!userId) {
        return next(ApiError.unauthorized('User not authenticated'));
      }
      const existingUser = await this.userService.getUserById(userId);
      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }
      const user = await this.userService.getUserByClientId(existingUser.client_id);
      user.client_id = user.id;
      user.id = userId;
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      // Validate input
     // validateRegister(req.body);

      const { email, password } = req.body;
      const authResponse = await this.authService.register(email, password);

      if (!authResponse || !authResponse.user_id) {
        throw new ApiError(500, 'Failed to register user in Auth0');
      }

      // Create user in database and sync with Healthie
      const userId = await this.userService.createUser({
          id: authResponse.user_id,
          email,
          first_name: email.split('@')[0],
          last_name: email.split('@')[0]
      });

      // Respond with success or user info
      res.status(201).json({ authResponse });
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(ApiError.internal('An unexpected error occurred'));
    }
  }

  async resetPassword(req, res, next) {
    try {
      // Validate input
     // validateResetPassword(req.body);
  
      const { email, currentPassword, newPassword } = req.body;

      const auth0Id = req.user.sub;
      const [provider, userId] = auth0Id.split('|');
      if (!userId) {
        return next(ApiError.unauthorized('User not authenticated'));
      }
      const existingUser = await this.userService.getUserById(userId);
      if (!existingUser || existingUser.email != email) {
        throw new ApiError(404, 'User not found');
      }

      await this.authService.changeUserPassword(newPassword, auth0Id);
  
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(ApiError.internal('An unexpected error occurred'));
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      const {
        first_name,
        last_name,
        email,
        phone_number,
        birthday,
        gender,
        height,
        primary_race_code,
        primary_ethnicity_code,
        location,
        locations
      } = req.body;
    
      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }
      const auth0Id = req.user.sub;

      if (email && email !== existingUser.email) {
        await this.authService.updateUser(auth0Id, { email });
      }
    
      const userData = {
        first_name,
        last_name,
        email,
        phone_number,
        birthday,
        gender,
        height,
        primary_race_code,
        primary_ethnicity_code,
        location: location || {},
        locations: locations || []
      };

      await this.userService.updateUser(id, existingUser.client_id, userData);
    
      res.status(200).json({
        message: 'User updated successfully'
      });
    
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(ApiError.internal('An unexpected error occurred'));
    }
  }
  */
}

module.exports = AuthController;
