import React from "react";
import { Text, View } from "react-native";
import app from "./connectFirebase";
import {getFirestore, collection, getDocs} from "firebase/firestore";
const  db = getFirestore(app);

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
