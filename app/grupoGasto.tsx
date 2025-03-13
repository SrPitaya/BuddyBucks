import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, FlatList, Alert, Share } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { auth, firestoredb } from "../firebase/connectFirebase";

export default function GrupoGasto() {
  const { id } = useLocalSearchParams();
  const [grupo, setGrupo] = useState<any>(null);
  const [tipoGasto, setTipoGasto] = useState("GRUPAL");
  const [categoria, setCategoria] = useState("comida");
  const [referencia, setReferencia] = useState("");
  const [monto, setMonto] = useState("");
  const [gastos, setGastos] = useState<any[]>([]);
  const [apodos, setApodos] = useState<{ [key: string]: string }>({}); // Mapa de id a apodo
  const router = useRouter();

  useEffect(() => {
    const fetchGrupo = async () => {
      if (id) {
        const grupoDoc = doc(firestoredb, "grupos", id as string);
        const grupoSnap = await getDoc(grupoDoc);

        if (grupoSnap.exists()) {
          setGrupo(grupoSnap.data());

          // Obtener los apodos de los miembros
          const miembros = grupoSnap.data().miembros;
          const apodosMap: { [key: string]: string } = {};
          await Promise.all(
            miembros.map(async (miembroId: string) => {
              const userDoc = doc(firestoredb, "users", miembroId);
              const userSnap = await getDoc(userDoc);
              if (userSnap.exists()) {
                apodosMap[miembroId] = userSnap.data().apodo;
              }
            })
          );
          setApodos(apodosMap);

          // Obtener los gastos del grupo
          const gastosData = await Promise.all(
            grupoSnap.data().gastos.map(async (gastoId: string) => {
              const gastoDoc = doc(firestoredb, "gastos", gastoId);
              const gastoSnap = await getDoc(gastoDoc);
              return gastoSnap.data();
            })
          );

          setGastos(gastosData);
        }
      }
    };

    fetchGrupo();
  }, [id]);

  const añadirGasto = async () => {
    if (!monto) {
      Alert.alert("Error", "Por favor, ingresa un monto.");
      return;
    }

    const gastoId = doc(collection(firestoredb, "gastos")).id;

    try {
      await setDoc(doc(firestoredb, "gastos", gastoId), {
        id: gastoId,
        grupoId: id,
        tipo: tipoGasto,
        categoria,
        monto: parseFloat(monto),
        referencia: tipoGasto === "INDIVIDUAL" ? referencia : null,
        creadoPor: auth.currentUser?.uid,
      });

      const grupoDoc = doc(firestoredb, "grupos", id as string);
      const grupoSnap = await getDoc(grupoDoc);
      const grupoData = grupoSnap.data();

      if (grupoData) {
        await setDoc(grupoDoc, {
          ...grupoData,
          gastos: [...grupoData.gastos, gastoId],
        });

        setGastos([...gastos, {
          id: gastoId,
          tipo: tipoGasto,
          categoria,
          monto: parseFloat(monto),
          referencia: tipoGasto === "INDIVIDUAL" ? referencia : null,
          creadoPor: auth.currentUser?.uid,
        }]);

        Alert.alert("Éxito", "Gasto añadido correctamente.");
        setTipoGasto("GRUPAL"); // Limpiar campos
        setCategoria("comida");
        setReferencia("");
        setMonto("");
      }
    } catch (error) {
      console.error("Error al añadir el gasto:", error);
      Alert.alert("Error", "Hubo un problema al añadir el gasto.");
    }
  };

  const finalizarGrupo = async () => {
    try {
      const grupoDoc = doc(firestoredb, "grupos", id as string);
      const grupoSnap = await getDoc(grupoDoc);
      const grupoData = grupoSnap.data();

      if (grupoData) {
        await setDoc(grupoDoc, {
          ...grupoData,
          estado: "FINALIZADO",
        });

        Alert.alert("Éxito", "Grupo de gastos finalizado correctamente.");
      }
    } catch (error) {
      console.error("Error al finalizar el grupo de gastos:", error);
      Alert.alert("Error", "Hubo un problema al finalizar el grupo de gastos.");
    }
  };

  const compartirCodigo = async () => {
    if (grupo?.codigo) {
      try {
        await Share.share({
          message: `Únete a mi grupo de gastos usando este código: ${grupo.codigo}`,
        });
      } catch (error) {
        console.error("Error al compartir el código:", error);
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Grupo de Gastos: {grupo?.tema}</Text>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Código del grupo: {grupo?.codigo}</Text>
      <Button title="Compartir código" onPress={compartirCodigo} />

      <Text style={{ fontSize: 18, marginTop: 20 }}>Añadir gasto</Text>

      <Picker
        selectedValue={tipoGasto}
        onValueChange={(itemValue: string) => setTipoGasto(itemValue)}
      >
        <Picker.Item label="GRUPAL" value="GRUPAL" />
        <Picker.Item label="INDIVIDUAL" value="INDIVIDUAL" />
      </Picker>

      <Picker
        selectedValue={categoria}
        onValueChange={(itemValue: string) => setCategoria(itemValue)}
      >
        <Picker.Item label="Comida" value="comida" />
        <Picker.Item label="Transporte" value="transporte" />
        <Picker.Item label="Entretenimiento" value="entretenimiento" />
        <Picker.Item label="Otros" value="otros" />
      </Picker>

      {tipoGasto === "INDIVIDUAL" && (
        <Picker
          selectedValue={referencia}
          onValueChange={(itemValue: string) => setReferencia(itemValue)}
        >
          <Picker.Item label="Selecciona un usuario" value="" />
          {grupo?.miembros
            .filter((miembroId: string) => miembroId !== auth.currentUser?.uid)
            .map((miembroId: string) => (
              <Picker.Item key={miembroId} label={apodos[miembroId]} value={miembroId} />
            ))}
        </Picker>
      )}

      <TextInput
        placeholder="Monto"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10, width: 200 }}
      />

      <Button title="Añadir gasto" onPress={añadirGasto} />

      <Text style={{ fontSize: 18, marginTop: 20 }}>Historial de gastos:</Text>
      <FlatList
        data={gastos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text>{item.creadoPor === auth.currentUser?.uid ? "Tú" : apodos[item.creadoPor]}</Text>
            <Text>Tipo: {item.tipo}</Text>
            <Text>Categoría: {item.categoria}</Text>
            {item.referencia && <Text>Referencia: {apodos[item.referencia]}</Text>}
            <Text>Monto: ${item.monto}</Text>
          </View>
        )}
      />

      <Button title="Finalizar grupo" onPress={finalizarGrupo} />
    </View>
  );
}