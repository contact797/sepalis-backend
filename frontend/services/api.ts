import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Utiliser l'API locale via le proxy Kubernetes
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  verifyToken: () =>
    api.post('/auth/verify-token'),
  
  getMe: () =>
    api.get('/auth/me'),
};

// Plants API
export const plantsAPI = {
  getCatalog: () =>
    api.get('/plants'),
  
  getUserPlants: () =>
    api.get('/user/plants'),
  
  addPlant: (plantData: any) =>
    api.post('/user/plants', plantData),
  
  updatePlant: (plantId: string, plantData: any) =>
    api.put(`/user/plants/${plantId}`, plantData),
  
  deletePlant: (plantId: string) =>
    api.delete(`/user/plants/${plantId}`),
};

// Tasks API
export const tasksAPI = {
  getTasks: () =>
    api.get('/user/tasks'),
  
  createTask: (taskData: any) =>
    api.post('/user/tasks', taskData),
  
  updateTask: (taskId: string, taskData: any) =>
    api.put(`/user/tasks/${taskId}`, taskData),
  
  deleteTask: (taskId: string) =>
    api.delete(`/user/tasks/${taskId}`),
  
  completeTask: (taskId: string) =>
    api.post(`/user/tasks/${taskId}/complete`),
};

// Courses API
export const coursesAPI = {
  getCourses: () =>
    api.get('/courses'),
  
  getCourse: (slug: string) =>
    api.get(`/courses/${slug}`),
  
  preregister: (courseData: any) =>
    api.post('/courses/preregister', courseData),
  
  bookCourse: (bookingData: any) =>
    api.post('/courses/book', bookingData),
  
  checkCourseBookingStatus: (sessionId: string) =>
    api.get(`/courses/booking/${sessionId}/status`),
};

// Workshops API
export const workshopsAPI = {
  getWorkshops: () =>
    api.get('/workshops'),
  
  getWorkshop: (slug: string) =>
    api.get(`/workshops/${slug}`),
  
  createBooking: (bookingData: any) =>
    api.post('/workshops/book', bookingData),
  
  checkBookingStatus: (sessionId: string) =>
    api.get(`/workshops/booking/${sessionId}/status`),
};

// Subscription API
export const subscriptionAPI = {
  createCheckoutSession: (planData: any) =>
    api.post('/create-checkout-session', planData),
  
  getSubscriptionStatus: () =>
    api.get('/subscription/status'),
  
  cancelSubscription: () =>
    api.post('/cancel-subscription'),
};

// AI Recognition API
export const aiAPI = {
  identifyPlant: (imageBase64: string) =>
    api.post('/ai/identify-plant', { image: imageBase64 }),
  
  diagnoseDisease: (imageBase64: string) =>
    api.post('/ai/diagnose-disease', { image: imageBase64 }),
};

// Zones API
export const zonesAPI = {
  getZones: () =>
    api.get('/user/zones'),
  
  getZone: (zoneId: string) =>
    api.get(`/user/zones/${zoneId}`),
  
  getZonePlants: (zoneId: string) =>
    api.get(`/user/zones/${zoneId}/plants`),
  
  createZone: (zoneData: any) =>
    api.post('/user/zones', zoneData),
  
  updateZone: (zoneId: string, zoneData: any) =>
    api.put(`/user/zones/${zoneId}`, zoneData),
  
  deleteZone: (zoneId: string) =>
    api.delete(`/user/zones/${zoneId}`),
};
