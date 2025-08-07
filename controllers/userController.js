// controllers/userController.js
import { db } from '../config/firebaseAdminInit.js';

export const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    await db.collection('users').doc(req.params.id).update(req.body);
    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error(`Error updating user ${req.params.id}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await db.collection('users').doc(req.params.id).delete();
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(`Error deleting user ${req.params.id}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
