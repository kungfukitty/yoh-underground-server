import { db, adminApp } from '../config/firebaseAdminInit.js';

// Fetch all users (admin only)
export async function getAllUsers(req, res) {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const { password, ...data } = doc.data();
      return { id: doc.id, ...data };
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
}

// Fetch a single user by ID (admin only)
export async function getUserById(req, res) {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...data } = doc.data();
    res.status(200).json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error fetching user.' });
  }
}

// Update a user document (admin only)
export async function updateUser(req, res) {
  try {
    const updates = req.body;
    const userRef = db.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }
    await userRef.update({
      ...updates,
      updatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
    });
    const updatedDoc = await userRef.get();
    const { password, ...data } = updatedDoc.data();
    res.status(200).json({ message: 'User updated successfully.', user: { id: updatedDoc.id, ...data } });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user.' });
  }
}

// Delete a user document (admin only)
export async function deleteUser(req, res) {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }
    await userRef.delete();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
}
