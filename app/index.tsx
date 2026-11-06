import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { C } from "../src/modules/theme";
import { API_HEADERS, API_URL } from "../src/modules/api";
import type { Task } from "../src/modules/tasks/types";
import { mapApiTask, toApiPriority } from "../src/modules/tasks/taskMapper";
import { TaskCard } from "../src/modules/tasks/TaskCard";
import TeamPanel from "../src/modules/users/TeamPanel";
import { s } from "../src/modules/dashboard/styles";
export default function Home() {
  const [authenticated, setAuthenticated] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loginError, setLoginError] = useState(""),
    [loggingIn, setLoggingIn] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [token, setToken] = useState(""),
    [currentUserId, setCurrentUserId] = useState("");
  const [role, setRole] = useState<"Admin" | "Usuario">("Admin"),
    [tab, setTab] = useState("Tareas"),
    [filter, setFilter] = useState("Todas"),
    [query, setQuery] = useState(""),
    [tasks, setTasks] = useState<Task[]>([]),
    [modal, setModal] = useState(false),
    [draft, setDraft] = useState(""),
    [selected, setSelected] = useState<Task | null>(null);
  const [taskDescription, setTaskDescription] = useState(""),
    [taskPriority, setTaskPriority] = useState<Task["priority"]>("Normal"),
    [taskDueAt, setTaskDueAt] = useState(""),
    [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]),
    [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]),
    [taskError, setTaskError] = useState(""),
    [taskLoading, setTaskLoading] = useState(false),
    [assigneesLoading, setAssigneesLoading] = useState(false);
  const shown = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "Todas" || t.status === filter) &&
          `${t.title} ${t.project} ${t.assignees.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [tasks, filter, query],
  );
  const counts = {
    active: tasks.filter(
      (t) => t.status === "Pendiente" || t.status === "En progreso",
    ).length,
    done: tasks.filter((t) => t.status === "Terminada").length,
    late: tasks.filter((t) => t.status === "Vencida").length,
  };
  async function loadTasks(authToken = token) {
    setTaskLoading(true);
    setTaskError("");
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}`, ...API_HEADERS },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudieron cargar las tareas.");
      }
      setTasks(result.map(mapApiTask));
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "No se pudieron cargar las tareas.",
      );
    } finally {
      setTaskLoading(false);
    }
  }

  async function openTaskModal() {
    setTaskError("");
    setModal(true);
    setAssigneesLoading(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}`, ...API_HEADERS },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo cargar el equipo.");
      }
      setAssignees(
        result
          .filter((user: { active: boolean }) => user.active)
          .map((user: { id: string; name: string }) => ({
            id: user.id,
            name: user.name,
          })),
      );
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "No se pudo cargar el equipo.",
      );
    } finally {
      setAssigneesLoading(false);
    }
  }

  async function addTask() {
    if (!draft.trim()) {
      setTaskError("El título es obligatorio.");
      return;
    }
    if (taskDueAt.trim() && Number.isNaN(Date.parse(taskDueAt))) {
      setTaskError("La fecha debe tener un formato válido, por ejemplo 2026-12-01.");
      return;
    }
    setTaskLoading(true);
    setTaskError("");
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...API_HEADERS,
        },
        body: JSON.stringify({
          title: draft.trim(),
          description: taskDescription.trim(),
          priority: toApiPriority(taskPriority),
          dueAt: taskDueAt.trim() ? new Date(taskDueAt).toISOString() : null,
          assigneeIds: selectedAssigneeIds,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo crear la tarea.");
      }
      setModal(false);
    setDraft("");
      setTaskDescription("");
      setTaskPriority("Normal");
      setTaskDueAt("");
      setSelectedAssigneeIds([]);
      await loadTasks();
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "No se pudo crear la tarea.",
      );
    } finally {
      setTaskLoading(false);
    }
  }

  async function finish(id: Task["id"]) {
    if (typeof id === "string") {
      try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...API_HEADERS,
          },
          body: JSON.stringify({ status: "COMPLETED" }),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "No se pudo completar la tarea.");
        }
        await loadTasks();
      } catch (error) {
        setTaskError(
          error instanceof Error ? error.message : "No se pudo completar la tarea.",
        );
      }
    }
    setSelected(null);
  }
  async function signIn() {
    if (!email.trim() || !password) {
      setLoginError("Ingresá tu email y contraseña para continuar.");
      return;
    }
    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...API_HEADERS },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setLoginError(
          response.status === 401
            ? "Email o contraseña incorrectos."
            : result.error || "No se pudo iniciar sesión.",
        );
        return;
      }
      setToken(result.token);
      setCurrentUserId(result.user?.id || "");
      setRole(result.user?.role === "ADMIN" ? "Admin" : "Usuario");
      setAuthenticated(true);
      void loadTasks(result.token);
    } catch {
      setLoginError(
        `No se pudo conectar con el servidor. Verificá la URL de API (${API_URL}) y que el servidor esté activo.`,
      );
    } finally {
      setLoggingIn(false);
    }
  }
  if (!authenticated) {
    return (
      <SafeAreaView style={loginS.safe}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          style={loginS.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={loginS.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={loginS.brand}>
              <View style={loginS.logo}>
                <Ionicons name="sunny" size={25} color="#f4c65d" />
              </View>
              <Text style={loginS.brandName}>OpDelSol</Text>
              <Text style={loginS.brandSub}>GESTIÓN DE EQUIPO</Text>
            </View>
            <View style={loginS.card}>
              <Text style={loginS.eyebrow}>BIENVENIDO/A</Text>
              <Text style={loginS.title}>Ingresá a tu cuenta</Text>
              <Text style={loginS.subtitle}>
                Usá tus credenciales de OpDelSol para continuar.
              </Text>
              <Text style={loginS.label}>EMAIL</Text>
              <View style={loginS.inputWrap}>
                <Ionicons name="mail-outline" size={19} color="#829087" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nombre@opdelsol.com"
                  placeholderTextColor="#a3aca5"
                  style={loginS.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              </View>
              <Text style={loginS.label}>CONTRASEÑA</Text>
              <View style={loginS.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#829087"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#a3aca5"
                  style={loginS.input}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={signIn}
                />
                <Pressable
                  onPress={() => setShowPassword((visible) => !visible)}
                  accessibilityLabel={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color="#829087"
                  />
                </Pressable>
              </View>
              {!!loginError && (
                <View style={loginS.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={17}
                    color="#a7462e"
                  />
                  <Text style={loginS.errorText}>{loginError}</Text>
                </View>
              )}
              <Pressable
                style={[loginS.button, loggingIn && loginS.buttonDisabled]}
                onPress={signIn}
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={loginS.buttonText}>Ingresar</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
            <Text style={loginS.footer}>Acceso exclusivo para el equipo</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.top}>
        <View style={s.brand}>
          <View style={s.logo}>
            <Ionicons name="sunny" size={19} color="#f4c65d" />
          </View>
          <View>
            <Text style={s.brandName}>OpDelSol</Text>
            <Text style={s.brandSub}>GESTIÓN DE EQUIPO</Text>
          </View>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{role === "Admin" ? "AD" : "LM"}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.greeting}>
          <View>
            <Text style={s.eyebrow}>MARTES, 3 DE NOVIEMBRE</Text>
            <Text style={s.heading}>
              Buen día {role === "Admin" ? "" : "Lucía"} ☀️
            </Text>
          </View>
          <View style={s.rolePill}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={C.green}
            />
            <Text style={s.roleText}>{role}</Text>
            <Ionicons name="chevron-down" size={13} color={C.green} />
          </View>
        </View>
        <View style={s.stats}>
          <Stat
            value={String(counts.active).padStart(2, "0")}
            label="ACTIVAS"
            icon="layers-outline"
          />
          <Stat
            value={String(counts.done).padStart(2, "0")}
            label="TERMINADAS"
            icon="checkmark-circle-outline"
          />
          <Stat
            value={String(counts.late).padStart(2, "0")}
            label="VENCIDAS"
            icon="time-outline"
            danger
          />
        </View>
        {tab !== "Equipo" && (
          <View style={s.sectionHead}>
            <View>
              <Text style={s.sectionTitle}>
                {tab === "Tareas" ? "Tareas del equipo" : tab}
              </Text>
              <Text style={s.sub}>
                {tab === "Calendario"
                  ? "Tu agenda, de un vistazo"
                  : `${shown.length} tareas asignadas`}
              </Text>
            </View>
            {role === "Admin" && (
              <Pressable style={s.addBtn} onPress={openTaskModal}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={s.addText}>Nueva</Text>
              </Pressable>
            )}
          </View>
        )}
        {tab === "Equipo" ? (
          <TeamPanel role={role} token={token} currentUserId={currentUserId} />
        ) : tab === "Calendario" ? (
          <View style={s.calendar}>
            <View style={s.month}>
              <Pressable>
                <Ionicons name="chevron-back" size={18} color={C.green} />
              </Pressable>
              <Text style={s.monthTitle}>Noviembre 2026</Text>
              <Pressable>
                <Ionicons name="chevron-forward" size={18} color={C.green} />
              </Pressable>
            </View>
            <View style={s.week}>
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <Text key={i} style={s.dayLabel}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={s.dates}>
              {Array.from({ length: 35 }, (_, i) => {
                let n = i - 5;
                return (
                  <Pressable
                    key={i}
                    onPress={() => n > 0 && n < 31 && setFilter("Todas")}
                    style={[s.dateCell, n === 3 && s.todayCell]}
                  >
                    <Text style={[s.dateNum, n === 3 && s.todayNum]}>
                      {n > 0 && n < 31 ? n : ""}
                    </Text>
                    {[3, 4, 5, 6, 10].includes(n) && <View style={s.dot} />}
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.calendarCaption}>HOY · 3 NOVIEMBRE</Text>
            {tasks
              .filter((t) => t.due.startsWith("Hoy"))
              .map((t) => (
                <Pressable
                  key={t.id}
                  style={s.agendaRow}
                  onPress={() => setSelected(t)}
                >
                  <View style={s.agendaTime}>
                    <Text style={s.agendaTimeText}>
                      {t.due.split(" · ")[1]}
                    </Text>
                  </View>
                  <View style={s.agendaBar} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.agendaTitle}>{t.title}</Text>
                    <Text style={s.agendaSub}>
                      {t.project} · {t.assignees.join(", ")}
                    </Text>
                  </View>
                </Pressable>
              ))}
          </View>
        ) : (
          <>
            <View style={s.search}>
              <Ionicons name="search" size={17} color={C.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar tareas o personas"
                placeholderTextColor="#9aa29c"
                style={s.searchInput}
              />
              <Ionicons name="options-outline" size={18} color={C.muted} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filters}
            >
              {[
                "Todas",
                "Pendiente",
                "En progreso",
                "Terminada",
                "Vencida",
              ].map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[s.filter, filter === f && s.filterOn]}
                >
                  <Text style={[s.filterText, filter === f && s.filterTextOn]}>
                    {f}
                  </Text>
                  {f === "Todas" && (
                    <Text
                      style={[s.filterCount, filter === f && s.filterTextOn]}
                    >
                      {tasks.length}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {shown.map((t) => (
              <TaskCard key={t.id} task={t} onPress={() => setSelected(t)} />
            ))}
            {taskLoading && (
              <View style={taskS.loading}>
                <ActivityIndicator color={C.green} />
                <Text style={taskS.loadingText}>Cargando tareas…</Text>
              </View>
            )}
            {!!taskError && <Text style={taskS.error}>{taskError}</Text>}
            {!taskLoading && !taskError && shown.length === 0 && (
              <Text style={taskS.empty}>Todavía no hay tareas para mostrar.</Text>
            )}
          </>
        )}
        <View style={s.footerSpace} />
      </ScrollView>
      <View style={s.bottom}>
        {[
          ["grid-outline", "Tareas"],
          ["calendar-outline", "Calendario"],
          ...(role === "Admin" ? [["people-outline", "Equipo"]] : []),
          ["time-outline", "Actividad"],
        ].map(([ic, label]) => (
          <Pressable
            key={label}
            onPress={() => setTab(label)}
            style={s.navItem}
          >
            <Ionicons
              name={ic as any}
              size={20}
              color={tab === label ? C.green : "#9da69f"}
            />
            <Text style={[s.navText, tab === label && s.navOn]}>{label}</Text>
            {tab === label && <View style={s.navDot} />}
          </Pressable>
        ))}
      </View>
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={s.scrim} onPress={() => setSelected(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            {selected && (
              <>
                <Text style={s.eyebrow}>
                  {selected.project.toUpperCase()} ·{" "}
                  {selected.priority.toUpperCase()}
                </Text>
                <Text style={s.detailTitle}>{selected.title}</Text>
                <Text style={s.detailText}>{selected.detail}</Text>
                <Text style={s.detailLabel}>ASIGNADA A</Text>
                <Text style={s.detailText}>
                  {selected.assignees.join("  ·  ")}
                </Text>
                <Text style={s.detailLabel}>FECHA LÍMITE</Text>
                <Text style={s.detailText}>{selected.due}</Text>
                <View style={s.statusRow}>
                  <View style={s.statusDot} />
                  <Text style={s.statusText}>{selected.status}</Text>
                </View>
                {selected.status !== "Terminada" &&
                  selected.status !== "Cancelada" && (
                    <Pressable
                      style={s.completeBtn}
                      onPress={() => finish(selected.id)}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="white"
                      />
                      <Text style={s.completeText}>Marcar como terminada</Text>
                    </Pressable>
                  )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={modal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(false)}
      >
        <View style={s.scrim}>
          <ScrollView
            style={taskS.dialogScroll}
            contentContainerStyle={taskS.dialogContainer}
            keyboardShouldPersistTaps="handled"
          >
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>Crear tarea</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Nombre de la tarea"
              style={s.input}
            />
            <TextInput
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="Descripción (opcional)"
              style={[s.input, taskS.multiline]}
              multiline
              textAlignVertical="top"
            />
            <Text style={taskS.label}>PRIORIDAD</Text>
            <View style={taskS.options}>
              {(["Baja", "Normal", "Alta", "Urgente"] as const).map(
                (priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => setTaskPriority(priority)}
                    style={[
                      taskS.option,
                      taskPriority === priority && taskS.optionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        taskS.optionText,
                        taskPriority === priority && taskS.optionTextSelected,
                      ]}
                    >
                      {priority}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
            <Text style={taskS.label}>FECHA LÍMITE</Text>
            <TextInput
              value={taskDueAt}
              onChangeText={setTaskDueAt}
              placeholder="2026-12-01 (opcional)"
              style={s.input}
              autoCapitalize="none"
            />
            <Text style={taskS.label}>ASIGNAR A</Text>
            {assigneesLoading ? (
              <ActivityIndicator color={C.green} />
            ) : assignees.length ? (
              <ScrollView style={taskS.assigneeList} nestedScrollEnabled>
                {assignees.map((user) => {
                  const selectedUser = selectedAssigneeIds.includes(user.id);
                  return (
                    <Pressable
                      key={user.id}
                      style={taskS.assigneeRow}
                      onPress={() =>
                        setSelectedAssigneeIds((ids) =>
                          selectedUser
                            ? ids.filter((id) => id !== user.id)
                            : [...ids, user.id],
                        )
                      }
                    >
                      <Ionicons
                        name={
                          selectedUser
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={19}
                        color={selectedUser ? C.green : C.muted}
                      />
                      <Text style={taskS.assigneeName}>{user.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={s.helper}>
                No hay usuarios activos disponibles. La tarea quedará sin asignar.
              </Text>
            )}
            {!!taskError && <Text style={taskS.error}>{taskError}</Text>}
            <View style={s.dialogActions}>
              <Pressable
                onPress={() => {
                  setModal(false);
                  setTaskError("");
                }}
              >
                <Text style={s.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  s.saveBtn,
                  (taskLoading || assigneesLoading) && { opacity: 0.6 },
                ]}
                onPress={addTask}
                disabled={taskLoading || assigneesLoading}
              >
                <Text style={s.saveText}>
                  {taskLoading ? "Guardando…" : "Crear tarea"}
                </Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function Stat({
  value,
  label,
  icon,
  danger,
}: {
  value: string;
  label: string;
  icon: any;
  danger?: boolean;
}) {
  return (
    <View style={s.stat}>
      <Ionicons name={icon} size={16} color={danger ? C.orange : C.green} />
      <Text style={[s.statValue, danger && { color: C.orange }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}
const taskS = StyleSheet.create({
  loading: { alignItems: "center", gap: 8, padding: 20 },
  loadingText: { color: C.muted, fontSize: 12 },
  empty: {
    color: C.muted,
    textAlign: "center",
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 20,
  },
  error: {
    color: "#a7462e",
    backgroundColor: "#fff1ed",
    borderRadius: 9,
    padding: 10,
    marginTop: 10,
    fontSize: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#87938b",
    marginTop: 13,
    marginBottom: 7,
  },
  multiline: { minHeight: 70, paddingTop: 12 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  option: {
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
  },
  optionSelected: { backgroundColor: "#edf3ed", borderColor: "#b8cbbd" },
  optionText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  optionTextSelected: { color: C.green },
  assigneeList: { maxHeight: 130, borderRadius: 9, backgroundColor: "#fbfcfa" },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  assigneeName: { color: "#20362b", fontSize: 12 },
  dialogScroll: { maxHeight: "92%", width: "100%" },
  dialogContainer: { flexGrow: 1, justifyContent: "flex-end", paddingBottom: 10 },
});

const loginS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6f2" },
  keyboard: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  brand: { alignItems: "center", marginBottom: 28 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#173f36",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandName: { fontSize: 25, fontWeight: "800", color: "#173f36" },
  brandSub: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#89948c",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7eae5",
    padding: 22,
    shadowColor: "#18372e",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#c05d36",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#20362b", marginTop: 7 },
  subtitle: { color: "#77827b", fontSize: 13, lineHeight: 19, marginTop: 7 },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#77827b",
    marginTop: 22,
    marginBottom: 8,
  },
  inputWrap: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e3e8e1",
    borderRadius: 12,
    backgroundColor: "#fbfcfa",
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: "#20362b", fontSize: 14, paddingVertical: 0 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff1ed",
    padding: 11,
    borderRadius: 10,
    marginTop: 16,
  },
  errorText: { flex: 1, color: "#a7462e", fontSize: 12, lineHeight: 17 },
  button: {
    height: 52,
    backgroundColor: "#173f36",
    borderRadius: 12,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  footer: {
    textAlign: "center",
    color: "#89948c",
    fontSize: 11,
    marginTop: 22,
  },
});
