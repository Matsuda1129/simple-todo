import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import Constants from "expo-constants";

const STORAGE_KEY = "@simple_todo_items";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");
  const [updateStatus, setUpdateStatus] = useState("確認中...");

  useEffect(() => {
    loadTodos();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (__DEV__) {
        setUpdateStatus("開発モード");
        return;
      }
      setUpdateStatus(`現在ID: ${Updates.updateId?.slice(0, 8) ?? "なし"}`);
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setUpdateStatus("更新あり。DL中...");
        await Updates.fetchUpdateAsync();
        setUpdateStatus("DL完了。再起動で反映");
      } else {
        setUpdateStatus((prev) => `${prev} / 最新`);
      }
    } catch (e: any) {
      setUpdateStatus(`エラー: ${e.message ?? String(e)}`.slice(0, 60));
    }
  };

  const saveTodos = async (items: Todo[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const loadTodos = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  };

  const addTodo = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    const updated = [newTodo, ...todos];
    setTodos(updated);
    saveTodos(updated);
    setInputText("");
    Keyboard.dismiss();
  }, [inputText, todos]);

  const toggleTodo = useCallback(
    (id: string) => {
      const updated = todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      );
      setTodos(updated);
      saveTodos(updated);
    },
    [todos],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      if (Platform.OS === "web") {
        const updated = todos.filter((todo) => todo.id !== id);
        setTodos(updated);
        saveTodos(updated);
        return;
      }
      Alert.alert("削除", "このTodoを削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            const updated = todos.filter((todo) => todo.id !== id);
            setTodos(updated);
            saveTodos(updated);
          },
        },
      ]);
    },
    [todos],
  );

  const renderItem = useCallback(
    ({ item }: { item: Todo }) => (
      <View style={styles.todoItem}>
        <Pressable
          style={styles.todoContent}
          onPress={() => toggleTodo(item.id)}
        >
          <View
            style={[styles.checkbox, item.completed && styles.checkboxChecked]}
          >
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text
            style={[
              styles.todoText,
              item.completed && styles.todoTextCompleted,
            ]}
            numberOfLines={2}
          >
            {item.text}
          </Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteTodo(item.id)}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    ),
    [toggleTodo, deleteTodo],
  );

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Simple Todo</Text>
          <Text style={styles.updateStatus}>version: {Constants.expoConfig?.version}</Text>
          <Text style={styles.updateStatus}>build: {Constants.expoConfig?.ios?.buildNumber}</Text>
          <Text style={styles.updateStatus}>status: {updateStatus}</Text>
        </View>
        {todos.length > 0 && (
          <Text style={styles.counter}>
            {completedCount}/{todos.length} 完了
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="新しいTodoを入力..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <Pressable
          style={[
            styles.addButton,
            !inputText.trim() && styles.addButtonDisabled,
          ]}
          onPress={addTodo}
          disabled={!inputText.trim()}
        >
          <Text style={styles.addButtonText}>追加</Text>
        </Pressable>
      </View>

      {todos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Todoはまだありません</Text>
          <Text style={styles.emptySubtext}>
            上の入力欄からTodoを追加しましょう
          </Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  counter: {
    fontSize: 14,
    color: "#888",
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  updateStatus: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 2,
    flexWrap: "wrap",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addButton: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#b0d4ff",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  todoContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 22,
  },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    fontSize: 22,
    color: "#ccc",
    fontWeight: "300",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 6,
  },
});
