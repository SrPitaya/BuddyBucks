import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestoredb } from "../firebase/connectFirebase";

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null); // Para almacenar los datos del usuario
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = doc(firestoredb, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.log("No se encontraron datos para el usuario.");
        }
      } else {
        router.replace("/auth"); // Si no hay sesión activa, redirige al login
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth"); // Redirige al login después de cerrar sesión
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {userData ? (
        <>
          <Text>Bienvenido, {userData.nombre} {userData.apellido}</Text>
          <Text>Apodo: {userData.apodo}</Text>
          <Text>Edad: {userData.edad}</Text>
          <Text>Género: {userData.genero}</Text>
          <Button title="Cerrar sesión" onPress={handleLogout} />
        </>
      ) : (
        <Text>Cargando datos...</Text>
      )}
    </View>
  );
}
