import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestoredb } from "../firebase/connectFirebase";
import { Button, Card, Title } from "react-native-paper";

export default function Perfil() {
  const [userData, setUserData] = useState<any>(null);
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
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth");
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FFFFFF' }}>
      <Card>
        <Card.Content>
          <Title style={{ fontSize: 24, marginBottom: 20 }}>Perfil</Title>
          {userData ? (
            <>
              <Text style={{ fontSize: 18 }}>Nombre: {userData.nombre}</Text>
              <Text style={{ fontSize: 18 }}>Apellido: {userData.apellido}</Text>
              <Text style={{ fontSize: 18 }}>Apodo: {userData.apodo}</Text>
              <Text style={{ fontSize: 18 }}>Edad: {userData.edad}</Text>
              <Text style={{ fontSize: 18 }}>Género: {userData.genero}</Text>
              <Text style={{ fontSize: 18 }}>Correo: {auth.currentUser?.email}</Text>
            </>
          ) : (
            <Text>Cargando datos del usuario...</Text>
          )}
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={handleLogout} style={{ marginTop: 20 }}>
        Cerrar Sesión
      </Button>
    </View>
  );
}