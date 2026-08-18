import {
    createEngineScript,
    createMarkerScript,
} from "./engine";

export default function generateLeafletHtml(){

    return createMapTemplate(

        createEngineScript()

        +

        createMarkerScript()

    );

}