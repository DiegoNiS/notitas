import { useState } from 'react';
import { AppRoute } from '../navigation/types';

export function useNavigationController(initialRoute: AppRoute = {type: 'welcome'}) {
    const [history, setHistory] = useState<AppRoute[]>([initialRoute]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const currentRoute = history[currentIndex];

    const navigateTo = (route: AppRoute) => {
        const cleanHistory = history.slice(0, currentIndex + 1);
        setHistory([...cleanHistory, route]);
        setCurrentIndex(cleanHistory.length);
    };

    const navigateBack = () => {
        if(currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const navigateForward = () => {
        if (currentIndex < history.length - 1){
            setCurrentIndex(prev => prev + 1);
        }
    };

    return {
        currentRoute,
        navigateTo,
        navigateBack,
        navigateForward,
        hasBack: currentIndex > 0,
        hasForward: currentIndex < history.length - 1
    }
}