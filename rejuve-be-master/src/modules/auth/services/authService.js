const axios = require('axios');
const auth0Config = require('../../../config/auth0');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    try {
      const response = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        audience: auth0Config.audience,
        grant_type: 'password',
        connection: 'Username-Password-Authentication',
        username: email,
        password,
      });
      
      return {
        token: response.data.access_token,
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Login service is unavailable');
    }
  }

  async register(email, password) {
    try {
      const response = await axios.post(`https://${auth0Config.domain}/dbconnections/signup`, {
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        password,
        email,
        connection: 'Username-Password-Authentication'
      });

      const loginResult = await this.login(email, password);

      return {
        message: 'User registered successfully',
        token: loginResult.token,
        user_id: response.data._id
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Registration service is unavailable');
    }
  }

  async updateUser(userId, updates) {
    try {
      const updatePayload = { ...updates };

      if (updates.email) {
        updatePayload.email_verified = false;
      }
      const managementApiToken = await this.getManagementApiToken();

      const response = await axios.patch(
        `https://${auth0Config.domain}/api/v2/users/${userId}`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${managementApiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Auth0 update service is unavailable');
    }
  }

  getSocialLoginUrl(provider) {
    const url = `https://${auth0Config.domain}/authorize`;
    const params = new URLSearchParams({
      client_id: auth0Config.clientId,
      response_type: 'code',
      redirect_uri: auth0Config.redirectUri,
      scope: 'openid profile email',
      connection: provider,
    });
    return `${url}?${params.toString()}`;
  }

  async handleLoginCallback(code) {
    try {
      const response = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        redirect_uri: auth0Config.redirectUri,
        code,
      });

      const userInfo = await axios.get(`https://${auth0Config.domain}/userinfo`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` },
      });
    
      return {
        token: response.data.access_token,
        user: userInfo.data,
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Login service is unavailable');
    }
  }

  async getSocialRegisterUrl(provider) {
    const redirectUri = `${process.env.APP_BASE_URL}/auth/callback`;

    const url = `https://${auth0Config.domain}/authorize?` +
      `response_type=code&` +
      `client_id=${auth0Config.clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `connection=${provider}&` +
      `scope=openid profile email`;

    return url;
  }

  async handleRegisterCallback(code) {
    try {
      const response = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        redirect_uri: `${process.env.APP_BASE_URL}/auth/callback`,
        code,
        grant_type: 'authorization_code',
      });

      const { access_token, id_token } = response.data;

      const userInfo = jwt.decode(id_token);

      return {
        token: access_token,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          provider: userInfo.sub.split('|')[0],
        },
      };
    } catch (error) {
      console.error('Error handling callback:', error.response?.data || error.message);
      throw new Error('Failed to handle social registration callback');
    }
  }

  async changeUserPassword(newPassword, userId) {
    try {
      const managementApiToken = await this.getManagementApiToken();

      const updatePasswordResponse = await axios.patch(
        `https://${auth0Config.domain}/api/v2/users/${userId}`,
        {
          password: newPassword,
          connection: 'Username-Password-Authentication'
        },
        {
          headers: {
            Authorization: `Bearer ${managementApiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (updatePasswordResponse.status !== 200) {
        throw new Error('Failed to change password');
      }

      return updatePasswordResponse.data; 
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(`Error: ${error.response.data.message || error.response.data.error_description}`);
      }
      throw new Error('An unexpected error occurred while changing the password');
    }
  }

  async getManagementApiToken() {
    try {
      const response = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        audience: `https://${auth0Config.domain}/api/v2/`,
        grant_type: 'client_credentials'
      });

      return response.data.access_token; 
    } catch (error) {
      throw new Error('Unable to get Management API token');
    }
  }
}

module.exports = AuthService;