import { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
    getUser,
    saveUser,
} from "../storage/userStorage";

export default function EditProfile() {

  const [user,setUser]=useState(null);
const [vehicleType,setVehicleType]=useState("");
const [vehicleBrand,setVehicleBrand]=useState("");
const [vehicleColor,setVehicleColor]=useState("");
const [plateNumber,setPlateNumber]=useState("");
  const [name,setName]=useState("");

  useEffect(()=>{

      loadUser();

  },[]);
const loadUser = async () => {

    const current = await getUser();

    setUser(current);

    setName(current.name || "");

    setVehicleType(current.vehicleType || "");

    setVehicleBrand(current.vehicleBrand || "");

    setVehicleColor(current.vehicleColor || "");

    setPlateNumber(current.plateNumber || "");

};

const save = async () => {
console.log(user);
  try {

    const updatedUser = {

      ...user,

      name,

      vehicleType,

      vehicleBrand,

      vehicleColor,

      plateNumber,

    };

    // Sauvegarde locale
    await saveUser(updatedUser);

    // Sauvegarde Firestore
    await updateDoc(
      doc(db, "users", user.userId),
      {
        name,
        vehicleType,
        vehicleBrand,
        vehicleColor,
        plateNumber,
      }
    );

    Alert.alert(
      "Succès",
      "Profil mis à jour."
    );

    router.back();

  } catch (error) {

    console.log(error);

    Alert.alert(
      "Erreur",
      "Impossible de mettre à jour le profil."
    );

  }

};

  if(!user){
      return null;
  }

  return(

      <SafeAreaView style={styles.container}>

          <ScrollView>

              <Text style={styles.title}>
                  Modifier le profil
              </Text>

              <Text style={styles.label}>
                  Nom
              </Text>

              <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
              />
              {user.role === "driver" && (

<>

<Text style={styles.label}>
Type de véhicule
</Text>

<TextInput
style={styles.input}
value={vehicleType}
onChangeText={setVehicleType}
/>

<Text style={styles.label}>
Marque
</Text>

<TextInput
style={styles.input}
value={vehicleBrand}
onChangeText={setVehicleBrand}
/>

<Text style={styles.label}>
Couleur
</Text>

<TextInput
style={styles.input}
value={vehicleColor}
onChangeText={setVehicleColor}
/>

<Text style={styles.label}>
Immatriculation
</Text>

<TextInput
style={styles.input}
value={plateNumber}
onChangeText={setPlateNumber}
/>

</>

)}

              <TouchableOpacity
                  style={styles.button}
                  onPress={save}
              >

                  <Text style={styles.buttonText}>
                      Enregistrer
                  </Text>

              </TouchableOpacity>

          </ScrollView>

      </SafeAreaView>

  );

}

const styles=StyleSheet.create({

container:{
flex:1,
padding:20,
backgroundColor:"#FFF",
},

title:{
fontSize:28,
fontWeight:"bold",
marginBottom:30,
color:"#0B6E4F",
},

label:{
fontSize:16,
marginBottom:8,
},

input:{
borderWidth:1,
borderColor:"#DDD",
borderRadius:12,
padding:15,
marginBottom:30,
},

button:{
backgroundColor:"#0B6E4F",
padding:18,
borderRadius:12,
alignItems:"center",
},

buttonText:{
color:"#FFF",
fontWeight:"bold",
fontSize:18,
},

});