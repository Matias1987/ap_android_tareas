import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View, Text, TextInput, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { API_HEADERS, API_URL } from "../api";
import { s } from "../dashboard/styles";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Usuario";
  active: boolean;
};

export default function TeamPanel({ role, token, currentUserId }: { role: "Admin" | "Usuario"; token: string; currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<"Todos" | "Activos" | "Inactivos">("Todos");
  const [modal, setModal] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [newRole, setNewRole] = useState<"Admin" | "Usuario">("Usuario");
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const active = members.filter((member) => member.active).length;
  const shown = members.filter(
    (member) =>
      (filter === "Todos" || (filter === "Activos" ? member.active : !member.active)) &&
      `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}`, ...API_HEADERS },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(response.status === 403
          ? "Solo un administrador puede administrar usuarios."
          : result.error || "No se pudo cargar la lista de usuarios.");
      }
      setMembers(result.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === "ADMIN" ? "Admin" : "Usuario",
        active: user.active,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : `No se pudo conectar con ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function addMember() {
    if (!name.trim() || !email.trim() || !password) {
      setError("Completá nombre, email y contraseña.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...API_HEADERS },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: newRole === "Admin" ? "ADMIN" : "USER",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo crear el usuario.");
      setName("");
      setEmail("");
      setPassword("");
      setNewRole("Usuario");
      setModal(false);
      setNotice("Usuario agregado correctamente.");
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function updateMember(member: Member, data: Record<string, string | boolean>, successMessage: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...API_HEADERS },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el usuario.");
      setNotice(successMessage);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    }
  }

  function changeRole(member: Member) {
    void updateMember(member, { role: member.role === "Admin" ? "USER" : "ADMIN" }, "Perfil actualizado.");
  }

  function toggleActive(member: Member) {
    if (member.active) {
      if (member.id === currentUserId) {
        setError("No podés eliminar tu propio usuario.");
        return;
      }
      Alert.alert(
        "Eliminar usuario",
        `Se desactivará el acceso de ${member.name}. Sus tareas e historial se conservarán.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => void updateMember(member, { active: false }, "Usuario eliminado (acceso desactivado)."),
          },
        ],
      );
      return;
    }
    void updateMember(member, { active: true }, "Usuario reactivado.");
  }
  return (
    <View>
      <View style={teamS.heading}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Personas</Text>
          <Text style={s.sub}>Administrá integrantes y permisos de acceso</Text>
        </View>
        {role === "Admin" && (
          <Pressable style={s.addBtn} onPress={() => setModal(true)}>
            <Ionicons name="person-add-outline" size={16} color="white" />
            <Text style={s.addText}>Agregar</Text>
          </Pressable>
        )}
      </View>
      <View style={teamS.summary}>
        <View style={teamS.summaryIcon}>
          <Ionicons name="people-outline" size={18} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={teamS.summaryLabel}>EQUIPO ACTUAL</Text>
          <Text style={teamS.summaryValue}>{members.length} integrantes</Text>
        </View>
        <View style={teamS.summaryDivider} />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={teamS.summaryLabel}>ACTIVOS</Text>
          <Text style={teamS.summaryValue}>{active}</Text>
        </View>
      </View>
      {!!error && (
        <View style={teamS.messageError}>
          <Ionicons name="alert-circle-outline" size={16} color="#a7462e" />
          <Text style={teamS.messageErrorText}>{error}</Text>
        </View>
      )}
      {!!notice && <Text style={teamS.notice}>{notice}</Text>}
      <View style={s.search}>
        <Ionicons name="search" size={17} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o email"
          placeholderTextColor="#9aa29c"
          style={s.searchInput}
        />
      </View>
      <View style={teamS.filters}>
        {(["Todos", "Activos", "Inactivos"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[teamS.filter, filter === f && teamS.filterOn]}
          >
            <Text
              style={[teamS.filterText, filter === f && teamS.filterTextOn]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={teamS.loading}>
          <ActivityIndicator color={C.green} />
          <Text style={teamS.emptyText}>Cargando usuarios…</Text>
        </View>
      ) : shown.length === 0 ? (
        <View style={teamS.empty}>
          <Ionicons name="person-outline" size={25} color="#9aa69e" />
          <Text style={teamS.emptyTitle}>No encontramos integrantes</Text>
          <Text style={teamS.emptyText}>Probá con otro nombre o filtro.</Text>
        </View>
      ) : (
        shown.map((member) => {
          const initials = member.name
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
          return (
            <View
              key={member.id}
              style={[teamS.member, !member.active && teamS.memberInactive]}
            >
              <View
                style={[
                  teamS.memberAvatar,
                  !member.active && teamS.avatarInactive,
                ]}
              >
                <Text style={teamS.memberInitials}>{initials}</Text>
              </View>
              <View style={teamS.memberInfo}>
                <View style={teamS.nameRow}>
                  <Text style={teamS.memberName}>{member.name}</Text>
                  <View
                    style={[
                      teamS.statusBadge,
                      member.active ? teamS.activeBadge : teamS.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        teamS.statusText,
                        member.active ? teamS.activeText : teamS.inactiveText,
                      ]}
                    >
                      {member.active ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>
                <Text style={teamS.memberEmail}>{member.email}</Text>
                <View style={teamS.metaRow}>
                  <View style={teamS.roleBadge}>
                    <Ionicons
                      name={
                        member.role === "Admin"
                          ? "shield-checkmark-outline"
                          : "person-outline"
                      }
                      size={12}
                      color={C.green}
                    />
                    <Text style={teamS.roleBadgeText}>
                      {member.role === "Admin" ? "Administrador" : "Integrante"}
                    </Text>
                  </View>
                </View>
                {role === "Admin" && (
                  <View style={teamS.actions}>
                    <Pressable
                      style={teamS.actionBtn}
                      onPress={() => changeRole(member)}
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={14}
                        color={C.green}
                      />
                      <Text style={teamS.actionText}>
                        {member.role === "Admin"
                          ? "Hacer integrante"
                          : "Hacer admin"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={teamS.actionBtn}
                      onPress={() => toggleActive(member)}
                    >
                      <Ionicons
                        name={
                          member.active
                            ? "pause-circle-outline"
                            : "play-circle-outline"
                        }
                        size={14}
                        color={member.active ? C.orange : C.green}
                      />
                      <Text
                        style={[
                          teamS.actionText,
                          member.active && { color: C.orange },
                        ]}
                      >
                        {member.active ? "Eliminar" : "Reactivar"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
      <Modal
        visible={modal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(false)}
      >
        <View style={s.scrim}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>Agregar integrante</Text>
            <Text style={teamS.fieldLabel}>NOMBRE</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre y apellido"
              style={s.input}
              autoCapitalize="words"
            />
            <Text style={teamS.fieldLabel}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="persona@opdelsol.com"
              style={s.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={teamS.fieldLabel}>CONTRASEÑA INICIAL</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña inicial"
              style={s.input}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={teamS.fieldLabel}>PERFIL DE ACCESO</Text>
            <View style={teamS.roleOptions}>
              {(["Usuario", "Admin"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setNewRole(option)}
                  style={[
                    teamS.roleOption,
                    newRole === option && teamS.roleOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      teamS.roleOptionText,
                      newRole === option && teamS.roleOptionTextSelected,
                    ]}
                  >
                    {option === "Admin" ? "Administrador" : "Integrante"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.helper}>La cuenta se creará como activa.</Text>
            <View style={s.dialogActions}>
              <Pressable onPress={() => setModal(false)}>
                <Text style={s.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, saving && { opacity: 0.6 }]}
                onPress={addMember}
                disabled={saving}
              >
                <Text style={s.saveText}>{saving ? "Guardando…" : "Agregar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const teamS = StyleSheet.create({
  loading: {
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  messageError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff1ed",
    padding: 11,
    borderRadius: 10,
    marginBottom: 12,
  },
  messageErrorText: { flex: 1, color: "#a7462e", fontSize: 12, lineHeight: 17 },
  notice: { color: "#397452", fontSize: 12, marginBottom: 12 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#8a968e",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
    color: C.green,
    marginTop: 4,
  },
  summaryDivider: {
    height: 34,
    width: 1,
    backgroundColor: C.line,
    marginHorizontal: 14,
  },
  filters: { flexDirection: "row", gap: 7, marginBottom: 12 },
  filter: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e4e8e2",
    backgroundColor: "#fff",
  },
  filterOn: { backgroundColor: C.green, borderColor: C.green },
  filterText: { fontSize: 10, fontWeight: "700", color: "#69766d" },
  filterTextOn: { color: "#fff" },
  member: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eaede7",
    padding: 13,
    marginBottom: 10,
  },
  memberInactive: { opacity: 0.72 },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#e5eee5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  avatarInactive: { backgroundColor: "#eef0ed" },
  memberInitials: { fontSize: 12, fontWeight: "800", color: C.green },
  memberInfo: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  memberName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#20362b",
    flexShrink: 1,
  },
  statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 7 },
  activeBadge: { backgroundColor: "#edf5ef" },
  inactiveBadge: { backgroundColor: "#f1f1ed" },
  statusText: { fontSize: 8, fontWeight: "800" },
  activeText: { color: "#4d8262" },
  inactiveText: { color: "#818a84" },
  memberEmail: { fontSize: 10, color: "#859088", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 9 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 7,
    backgroundColor: "#f1f5f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  roleBadgeText: { fontSize: 9, fontWeight: "700", color: C.green },
  taskCount: { fontSize: 9, color: C.muted },
  actions: { flexDirection: "row", gap: 7, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e4e8e2",
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 7,
  },
  actionText: { fontSize: 9, fontWeight: "700", color: C.green },
  empty: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 25,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.green,
    marginTop: 10,
  },
  emptyText: { fontSize: 10, color: C.muted, marginTop: 4 },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#87938b",
    marginTop: 13,
  },
  roleOptions: { flexDirection: "row", gap: 8, marginTop: 9 },
  roleOption: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
  },
  roleOptionSelected: { backgroundColor: "#edf3ed", borderColor: "#cbd9cd" },
  roleOptionText: { fontSize: 10, fontWeight: "700", color: "#78847c" },
  roleOptionTextSelected: { color: C.green },
});
