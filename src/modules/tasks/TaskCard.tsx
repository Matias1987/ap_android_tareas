import React from "react";
import { Pressable, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { s } from "../dashboard/styles";
import type { Task } from "./types";

export function TaskCard({ task: t, onPress }: { task: Task; onPress: () => void }) {
  let urgent = t.priority === "Urgente" || t.priority === "Alta";
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View
        style={[
          s.priorityLine,
          {
            backgroundColor:
              t.priority === "Urgente"
                ? "#c05d36"
                : t.priority === "Alta"
                  ? "#d5a746"
                  : "#8aa599",
          },
        ]}
      />
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <View style={s.project}>
            <View style={s.projectDot} />
            <Text style={s.projectName}>{t.project}</Text>
          </View>
          <View
            style={[
              s.priority,
              {
                backgroundColor:
                  t.priority === "Urgente"
                    ? "#fbede7"
                    : t.priority === "Alta"
                      ? "#faf4e2"
                      : "#eff2ed",
              },
            ]}
          >
            <Text
              style={[
                s.priorityText,
                {
                  color:
                    t.priority === "Urgente"
                      ? C.orange
                      : t.priority === "Alta"
                        ? "#9b7623"
                        : "#748078",
                },
              ]}
            >
              {t.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={s.taskTitle}>{t.title}</Text>
        <Text style={s.taskDetail}>{t.detail}</Text>
        <View style={s.cardBottom}>
          <View style={s.people}>
            {t.assignees.slice(0, 2).map((a, i) => (
              <View key={a} style={[s.personAvatar, i > 0 && s.personOverlap]}>
                <Text style={s.personInitial}>
                  {a
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </Text>
              </View>
            ))}
            <Text style={s.peopleText}>{t.assignees.join(", ")}</Text>
          </View>
          <View style={s.due}>
            <Ionicons
              name="time-outline"
              size={13}
              color={urgent ? C.orange : C.muted}
            />
            <Text style={[s.dueText, urgent && { color: C.orange }]}>
              {t.due}
            </Text>
          </View>
        </View>
        <View style={s.cardStatus}>
          <View
            style={[
              s.statusPip,
              {
                backgroundColor:
                  t.status === "Terminada"
                    ? "#519779"
                    : t.status === "En progreso"
                      ? "#d9a73f"
                      : "#a9b5ad",
              },
            ]}
          />
          <Text style={s.cardStatusText}>{t.status}</Text>
        </View>
      </View>
    </Pressable>
  );
}
