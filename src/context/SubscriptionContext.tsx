import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi } from '../services/commonAPIs'; 
import { userProfileSummaryAPI } from '../services/apiendpoints';
import { Alert } from 'react-native';


const SubscriptionContext = createContext<any>(null);

export const SubscriptionProvider = ({ children }: any) => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    const fetchProfile = async () => {
        // Only show loader on first load, or remove setLoading(true) 
        // if you want a silent refresh in the background
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('id');
            if (!userId) {
                setLoading(false);
                return;
            }

            getApi(`/${userProfileSummaryAPI}/${userId}`, (res: any) => {
                if (res.succeeded) {
                    setUserData(res.data);
                }
                setLoading(false);
            }, (err: any) => {
                console.error("Profile Fetch Error:", err);
                setLoading(false);
            });
        } catch (e) {
            setLoading(false);
        }
    };

    const isProEligible = () => {
        if (!userData) return false;
        if (!userData.isProUser) return true;

        // Check if expiring in less than 30 days
        if (userData.expiresDate) {

            const expiry = new Date(userData.expiresDate);
            const today = new Date();
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return diffDays <= 30;
        }
        return false;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <SubscriptionContext.Provider value={{
            userData, loading, refreshProfile: fetchProfile, isProEligible
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);