import React, { useState } from "react";
import { View, Alert } from "react-native";
import { Button, TextInput, Text, useTheme } from "react-native-paper";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { auth, firestoredb } from "../firebase/connectFirebase";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [apodo, setApodo] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(firestoredb, "users", user.uid), {
          email: user.email,
          nombre,
          apellido,
          apodo,
          edad: parseInt(edad),
          genero,
        });

        router.replace("/dashboard");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error de autenticación:", err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
      <Text style={{ fontSize: 24, marginBottom: 20, color: colors.primary }}>
        {isLogin ? "Iniciar sesión" : "Registrarse"}
      </Text>

      <TextInput
        label="Correo"
        value={email}
        onChangeText={setEmail}
        style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
        mode="outlined"
        theme={{ colors: { primary: "#52CC99" } }}
      />

      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
        mode="outlined"
        theme={{ colors: { primary: "#52CC99" } }}
      />

      {!isLogin && (
        <>
          <TextInput
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
            mode="outlined"
            theme={{ colors: { primary: "#52CC99" } }}
          />

          <TextInput
            label="Apellido"
            value={apellido}
            onChangeText={setApellido}
            style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
            mode="outlined"
            theme={{ colors: { primary: "#52CC99" } }}
          />

          <TextInput
            label="Apodo"
            value={apodo}
            onChangeText={setApodo}
            style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
            mode="outlined"
            theme={{ colors: { primary: "#52CC99" } }}
          />

          <TextInput
            label="Edad"
            value={edad}
            onChangeText={setEdad}
            keyboardType="numeric"
            style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
            mode="outlined"
            theme={{ colors: { primary: "#52CC99" } }}
          />

          <TextInput
            label="Género"
            value={genero}
            onChangeText={setGenero}
            style={{ width: "80%", marginBottom: 10, backgroundColor: "#FFFFFF" }}
            mode="outlined"
            theme={{ colors: { primary: "#52CC99" } }}
          />
        </>
      )}

      <Button
        mode="contained"
        onPress={handleAuth}
        style={{ width: "80%", marginBottom: 10, backgroundColor: "#52CC99" }}
      >
        {isLogin ? "Iniciar sesión" : "Registrarse"}
      </Button>

      <Button
        mode="text"
        onPress={() => setIsLogin(!isLogin)}
        style={{ width: "80%" }}
        labelStyle={{ color: "#52CC99" }}
      >
        {isLogin ? "Cambiar a Registro" : "Cambiar a Login"}
      </Button>
    </View>
  );
}