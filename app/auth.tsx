import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"; // Asegúrate de importar estas funciones
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
  const [isLogin, setIsLogin] = useState(true); // Controla si es login o registro
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Login: solo correo y contraseña
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/dashboard"); // Redirige al dashboard después de loguearse
      } else {
        // Registro: guardar datos adicionales
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar los datos adicionales del usuario en Firestore
        await setDoc(doc(firestoredb, "users", user.uid), {
          email: user.email,
          nombre,
          apellido,
          apodo,
          edad: parseInt(edad),  // Asegúrate de convertir la edad a número
          genero,
        });

        router.replace("/dashboard"); // Redirige al dashboard después de registrarse
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error de autenticación:", err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{isLogin ? "Iniciar sesión" : "Registrarse"}</Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
      />

      {!isLogin && (
        <>
          <TextInput
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
            style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
          />
          <TextInput
            placeholder="Apellido"
            value={apellido}
            onChangeText={setApellido}
            style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
          />
          <TextInput
            placeholder="Apodo"
            value={apodo}
            onChangeText={setApodo}
            style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
          />
          <TextInput
            placeholder="Edad"
            value={edad}
            onChangeText={setEdad}
            keyboardType="numeric"
            style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
          />
          <TextInput
            placeholder="Género"
            value={genero}
            onChangeText={setGenero}
            style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
          />
        </>
      )}

      <Button title={isLogin ? "Iniciar sesión" : "Registrarse"} onPress={handleAuth} />
      <Button title={`Cambiar a ${isLogin ? "Registro" : "Login"}`} onPress={() => setIsLogin(!isLogin)} />
    </View>
  );
}
