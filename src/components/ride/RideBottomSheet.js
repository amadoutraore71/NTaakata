import { useMemo } from "react";

import BottomSheet, {
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import DriverInfoCard from "./DriverInfoCard";
import RideActionButtons from "./RideActionButtons";
import RideArrivalInfo from "./RideArrivalInfo";
import RideStatusBadge from "./RideStatusBadge";
export default function RideBottomSheet({
    driver,
    ride,
    distance,
    duration,
    eta,
    phone,
    onChat,
    onCancel,
}) {

    const snapPoints = useMemo(
        () => ["35%", "60%", "88%"],
        []
    );

    return (

        <BottomSheet
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
        >
            <BottomSheetView style={{ flex: 1 }}>
                <RideStatusBadge
                    status={ride?.status}
                />
                <DriverInfoCard
                    driver={driver}
                    ride={ride}
                />

                <RideArrivalInfo
                    fare={ride?.estimatedPrice}
                    destination={ride?.destination?.address}
                    paymentMethod={ride?.paymentMethod}
                />

                <RideActionButtons
                    phone={phone}
                    onChat={onChat}
                    onCancel={onCancel}
                />

            </BottomSheetView>

        </BottomSheet>

    );
}