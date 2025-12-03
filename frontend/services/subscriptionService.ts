import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// IMPORTANT: Remplacez ces clés par vos vraies clés RevenueCat
// À obtenir sur https://app.revenuecat.com/
const REVENUECAT_API_KEY_IOS = 'YOUR_IOS_API_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_ANDROID_API_KEY_HERE';

export const subscriptionService = {
  /**
   * Initialise RevenueCat avec l'utilisateur
   */
  async initialize(userId: string): Promise<void> {
    try {
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEY_IOS,
        android: REVENUECAT_API_KEY_ANDROID,
      });

      if (!apiKey || apiKey.includes('YOUR_')) {
        console.warn('⚠️ Clés RevenueCat non configurées - Mode démo');
        return;
      }

      await Purchases.configure({ apiKey, appUserID: userId });
      console.log('✅ RevenueCat initialisé');
    } catch (error) {
      console.error('Erreur initialisation RevenueCat:', error);
    }
  },

  /**
   * Récupère les offres disponibles
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Erreur récupération offres:', error);
      return null;
    }
  },

  /**
   * Achète un package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('✅ Achat réussi');
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('Achat annulé par l\'utilisateur');
      } else {
        console.error('Erreur achat:', error);
      }
      return null;
    }
  },

  /**
   * Restaure les achats
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Achats restaurés');
      return customerInfo;
    } catch (error) {
      console.error('Erreur restauration achats:', error);
      return null;
    }
  },

  /**
   * Vérifie si l'utilisateur a un abonnement actif
   */
  async checkSubscription(): Promise<{
    isActive: boolean;
    isTrial: boolean;
    expiresAt: Date | null;
  }> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlements = customerInfo.entitlements.active;
      
      // Vérifier si l'utilisateur a l'entitlement "premium"
      const hasPremium = 'premium' in entitlements;
      
      if (hasPremium) {
        const premiumEntitlement = entitlements['premium'];
        return {
          isActive: true,
          isTrial: premiumEntitlement.willRenew === false,
          expiresAt: premiumEntitlement.expirationDate
            ? new Date(premiumEntitlement.expirationDate)
            : null,
        };
      }

      return {
        isActive: false,
        isTrial: false,
        expiresAt: null,
      };
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      return {
        isActive: false,
        isTrial: false,
        expiresAt: null,
      };
    }
  },

  /**
   * Obtient les informations client
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Erreur info client:', error);
      return null;
    }
  },
};
