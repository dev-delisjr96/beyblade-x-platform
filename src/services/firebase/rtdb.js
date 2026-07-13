import rtdb from "../../configs/firebase/rtdb";
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  /* eslint-disable-next-line no-unused-vars */
  child,
} from "firebase/database";

/**
 * CREATE
 * Adds a new record. If you don't pass an id, Firebase auto-generates one (push key).
 */
export async function createData(path, data, id = null) {
  try {
    if (id) {
      // Create/overwrite at a specific known key
      await set(ref(rtdb, `${path}/${id}`), data);
      return { id, ...data };
    } else {
      // Let Firebase generate a unique key
      const newRef = push(ref(rtdb, path));
      await set(newRef, data);
      return { id: newRef.key, ...data };
    }
  } catch (error) {
    console.error("createData error:", error);
    throw error;
  }
}

/**
 * READ (one-time fetch)
 * Reads a whole node or a single child by id.
 */
export async function readData(path, id = null) {
  try {
    const dbRef = id ? ref(rtdb, `${path}/${id}`) : ref(rtdb, path);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) return id ? null : {};

    if (id) {
      return { id, ...snapshot.val() };
    }

    // Convert object-of-objects into an array of { id, ...fields }
    const val = snapshot.val();
    return Object.entries(val).map(([key, value]) => ({ id: key, ...value }));
  } catch (error) {
    console.error("readData error:", error);
    throw error;
  }
}

/**
 * READ (real-time subscription)
 * Use inside a useEffect. Returns an unsubscribe function — call it on cleanup.
 */
export function subscribeToData(path, callback, onError = console.error) {
  const dbRef = ref(rtdb, path);

  const listener = onValue(
    dbRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const val = snapshot.val();
      const isList = Object.values(val).every(
        (v) => typeof v === "object" && v !== null,
      );
      console.log("subscribed data", val);
      if (isList) {
        callback(
          Object.entries(val).map(([key, value]) => ({ id: key, ...value })),
        );
      } else {
        callback(val);
      }
    },
    onError,
  );

  // Return an unsubscribe function for cleanup in useEffect
  return () => off(dbRef, "value", listener);
}

/**
 * UPDATE
 * Merges fields into an existing record without overwriting the whole node.
 */
export async function updateData(path, id, data) {
  try {
    await update(ref(rtdb, `${path}/${id}`), data);
    return { id, ...data };
  } catch (error) {
    console.error("updateData error:", error);
    throw error;
  }
}

/**
 * DELETE
 * Removes a record by id, or an entire node if no id is given.
 */
export async function deleteData(path, id = null) {
  try {
    const dbRef = id ? ref(rtdb, `${path}/${id}`) : ref(rtdb, path);
    await remove(dbRef);
    return true;
  } catch (error) {
    console.error("deleteData error:", error);
    throw error;
  }
}
