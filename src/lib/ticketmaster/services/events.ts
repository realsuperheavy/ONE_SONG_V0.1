import axios from 'axios';

const TICKETMASTER_API_URL = 'https://app.ticketmaster.com/discovery/v2';
const CONSUMER_KEY = 'ANXcyy5A7uLuGwYJkoDxn87yfMQ0t789';

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    timezone: string;
    status: {
      code: string;
    };
  };
  _embedded: {
    venues: Array<{
      name: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
}

export const ticketmasterService = {
  getNearbyEvents: async (latitude: number, longitude: number, radius: number = 10): Promise<TicketmasterEvent[]> => {
    try {
      const response = await axios.get(`${TICKETMASTER_API_URL}/events.json`, {
        params: {
          apikey: CONSUMER_KEY,
          latlong: `${latitude},${longitude}`,
          radius,
          unit: 'miles',
          size: 20,
          sort: 'date,asc'
        }
      });

      return response.data._embedded?.events || [];
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error);
      return [];
    }
  },

  searchEvents: async (keyword: string): Promise<TicketmasterEvent[]> => {
    try {
      const response = await axios.get(`${TICKETMASTER_API_URL}/events.json`, {
        params: {
          apikey: CONSUMER_KEY,
          keyword,
          size: 10,
          sort: 'date,asc'
        }
      });

      return response.data._embedded?.events || [];
    } catch (error) {
      console.error('Error searching Ticketmaster events:', error);
      return [];
    }
  },

  getEventDetails: async (eventId: string): Promise<TicketmasterEvent | null> => {
    try {
      const response = await axios.get(`${TICKETMASTER_API_URL}/events/${eventId}.json`, {
        params: {
          apikey: CONSUMER_KEY
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      return null;
    }
  }
}; 