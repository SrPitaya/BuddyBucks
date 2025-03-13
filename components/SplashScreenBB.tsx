import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from 'lottie-react-native';

import SPBuddyBucks from '@/assets/lotties/SPBuddyBucks.json';

export default function SplashScreenBB({onFinish = (isCancelled) => {}} : {onFinish?: (isCancelled:boolean) => void}) { 
    return (
           <LottieView
                source={SPBuddyBucks}
                onAnimationFinish={onFinish}
                autoPlay
                resizeMode="cover"
                loop = {false}
                style={{ flex: 1, width: '100%' }}/>
    )
}
