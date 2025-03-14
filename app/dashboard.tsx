import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { auth, firestoredb } from "../firebase/connectFirebase";
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, TextInput, Title, Text } from "react-native-paper";

type Deuda = {
  deudaTotal: number;
  acreedores: Array<{
    apodo: string;
    monto: number;
    categoria: string;
    tipo: string;
    tema: string;
    grupoId: string;
    pagado: boolean;
  }>;
};

type Deudas = {
  [key: string]: Deuda;
};

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<Deudas>({});
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const router = useRouter();

  // Obtener datos del usuario
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

  // Obtener grupos del usuario
  useEffect(() => {
    const fetchGrupos = async () => {
      if (auth.currentUser) {
        const q = query(collection(firestoredb, "grupos"), where("miembros", "array-contains", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const gruposData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGrupos(gruposData);
      }
    };

    fetchGrupos();
  }, []);

  // Calcular deudas cuando cambian los grupos
  useEffect(() => {
    calcularDeudas();
  }, [grupos]);

  // Crear un nuevo grupo de gastos
  const crearGrupoDeGastos = async () => {
    if (!nombreGrupo) {
      Alert.alert("Error", "Por favor, ingresa un nombre para el grupo.");
      return;
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const grupoId = doc(collection(firestoredb, "grupos")).id;

    try {
      await setDoc(doc(firestoredb, "grupos", grupoId), {
        id: grupoId,
        codigo,
        tema: nombreGrupo,
        estado: "ACTIVO",
        miembros: [auth.currentUser?.uid],
        gastos: [],
      });

      // Actualizar el estado local inmediatamente
      setGrupos([...grupos, { id: grupoId, codigo, tema: nombreGrupo, estado: "ACTIVO", miembros: [auth.currentUser?.uid], gastos: [] }]);
      setNombreGrupo("");
      Alert.alert("Éxito", "Grupo de gastos creado correctamente.");
    } catch (error) {
      console.error("Error al crear el grupo de gastos:", error);
      Alert.alert("Error", "Hubo un problema al crear el grupo de gastos.");
    }
  };

  // Unirse a un grupo existente
  const unirseAGrupo = async () => {
    if (!codigoInvitacion) {
      Alert.alert("Error", "Por favor, ingresa un código de invitación.");
      return;
    }

    try {
      const q = query(collection(firestoredb, "grupos"), where("codigo", "==", codigoInvitacion));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Error", "No se encontró un grupo con ese código de invitación.");
        return;
      }

      const grupoDoc = querySnapshot.docs[0];
      const grupoData = grupoDoc.data();

      if (grupoData.miembros.includes(auth.currentUser?.uid)) {
        Alert.alert("Error", "Ya eres miembro de este grupo.");
        return;
      }

      // Actualizar Firestore
      await updateDoc(doc(firestoredb, "grupos", grupoDoc.id), {
        miembros: [...grupoData.miembros, auth.currentUser?.uid],
      });

      // Actualizar el estado local inmediatamente
      setGrupos([...grupos, { id: grupoDoc.id, ...grupoData }]);
      setCodigoInvitacion("");
      Alert.alert("Éxito", "Te has unido al grupo de gastos correctamente.");
    } catch (error) {
      console.error("Error al unirse al grupo de gastos:", error);
      Alert.alert("Error", "Hubo un problema al unirse al grupo de gastos.");
    }
  };

  // Calcular deudas
  const calcularDeudas = async () => {
    const deudasCalculadas: Deudas = {};

    for (const grupo of grupos) {
      if (grupo.estado === "FINALIZADO") {
        const gastosData = await Promise.all(
          grupo.gastos.map(async (gastoId: string) => {
            const gastoDoc = doc(firestoredb, "gastos", gastoId);
            const gastoSnap = await getDoc(gastoDoc);
            return gastoSnap.data();
          })
        );

        for (const gasto of gastosData) {
          if (gasto.tipo === "GRUPAL") {
            const montoPorPersona = gasto.monto / grupo.miembros.length;

            for (const miembroId of grupo.miembros) {
              if (miembroId !== gasto.creadoPor) {
                const userDoc = doc(firestoredb, "users", gasto.creadoPor);
                const userSnap = await getDoc(userDoc);
                const apodoAcreedor = userSnap.data()?.apodo || "Desconocido";

                if (!deudasCalculadas[miembroId]) {
                  deudasCalculadas[miembroId] = {
                    deudaTotal: 0,
                    acreedores: [],
                  };
                }

                // Verificar si la deuda ya existe
                const deudaExistente = deudasCalculadas[miembroId].acreedores.find(
                  (a) => a.grupoId === grupo.id && a.apodo === apodoAcreedor
                );

                if (!deudaExistente) {
                  deudasCalculadas[miembroId].deudaTotal += montoPorPersona;
                  deudasCalculadas[miembroId].acreedores.push({
                    apodo: apodoAcreedor,
                    monto: montoPorPersona,
                    categoria: gasto.categoria,
                    tipo: gasto.tipo,
                    tema: grupo.tema,
                    grupoId: grupo.id,
                    pagado: false,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Guardar las deudas en Firestore solo si no existen
    for (const [miembroId, deuda] of Object.entries(deudasCalculadas)) {
      const deudaRef = doc(firestoredb, "deudas", miembroId);
      const deudaSnap = await getDoc(deudaRef);

      if (!deudaSnap.exists()) {
        await setDoc(deudaRef, deuda);
      }
    }

    // Actualizar el estado local de las deudas
    setDeudas(deudasCalculadas);
  };

  // Pagar una deuda
  const pagarDeuda = async (grupoId: string, acreedorId: string, monto: number) => {
    try {
      const grupoDoc = doc(firestoredb, "grupos", grupoId);
      const grupoSnap = await getDoc(grupoDoc);

      if (!grupoSnap.exists()) {
        Alert.alert("Error", "El grupo no existe.");
        return;
      }

      const grupoData = grupoSnap.data();

      // Actualizar la deuda del usuario actual en Firestore
      const deudaRef = doc(firestoredb, "deudas", auth.currentUser?.uid || "");
      const deudaSnap = await getDoc(deudaRef);

      if (deudaSnap.exists()) {
        const deudaData = deudaSnap.data();
        const acreedorIndex = deudaData.acreedores.findIndex((a: any) => a.apodo === acreedorId);

        if (acreedorIndex !== -1) {
          // Marcar la deuda como pagada
          deudaData.acreedores[acreedorIndex].pagado = true;
          deudaData.deudaTotal -= monto;

          // Actualizar Firestore
          await updateDoc(deudaRef, {
            acreedores: deudaData.acreedores,
            deudaTotal: deudaData.deudaTotal,
          });

          // Actualizar el estado local de las deudas
          if (auth.currentUser?.uid) {
            setDeudas({ ...deudas, [auth.currentUser.uid]: deudaData as Deuda });
          }

          Alert.alert("Éxito", `Has pagado $${monto} a ${acreedorId}.`);
        }
      }
    } catch (error) {
      console.error("Error al pagar la deuda:", error);
      Alert.alert("Error", "Hubo un problema al pagar la deuda.");
    }
  };

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FFFFFF' }}>
      <Card>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Title style={{ fontSize: 24 }}>Dashboard</Title>
            <TouchableOpacity onPress={() => router.push("/perfil")}>
              <Ionicons name="person-circle-outline" size={32} color="#52CC99" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <TextInput
        label="Nombre del grupo"
        value={nombreGrupo}
        onChangeText={setNombreGrupo}
        style={{ marginBottom: 10 }}
      />
      <Button mode="contained" onPress={crearGrupoDeGastos} style={{ marginBottom: 10 }}>
        Crear grupo de gasto
      </Button>

      <TextInput
        label="Código de invitación"
        value={codigoInvitacion}
        onChangeText={setCodigoInvitacion}
        style={{ marginBottom: 10 }}
      />
      <Button mode="contained" onPress={unirseAGrupo} style={{ marginBottom: 20 }}>
        Unirse a un grupo
      </Button>

      <Title style={{ fontSize: 20 }}>Grupos a los que perteneces:</Title>
      <FlatList
        data={grupos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" }}
            onPress={() => router.push(`/grupoGasto?id=${item.id}`)}
          >
            <Text>{item.tema}</Text>
            <Text>Estado: {item.estado}</Text>
          </TouchableOpacity>
        )}
      />

      <Title style={{ fontSize: 20, marginTop: 20 }}>Deudas:</Title>
      {auth.currentUser && deudas[auth.currentUser.uid] && (
        <View style={{ marginTop: 10 }}>
          <Text>Deuda Total: ${deudas[auth.currentUser.uid].deudaTotal}</Text>
          <FlatList
            data={deudas[auth.currentUser.uid].acreedores}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 10 }}>
                <Text>{item.apodo} -- {item.tema} – {item.tipo} --- {item.categoria} --- ${item.monto}</Text>
                {!item.pagado && (
                  <Button mode="contained" onPress={() => pagarDeuda(item.grupoId, item.apodo, item.monto)}>
                    Pagar
                  </Button>
                )}
              </View>
            )}
          />
        </View>
      )}

      <Button mode="contained" onPress={handleLogout} style={{ marginTop: 20 }}>
        Cerrar Sesión
      </Button>
    </View>
  );
}