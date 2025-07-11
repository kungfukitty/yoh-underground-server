        }

        const token = generateToken(userId);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error: Could not generate token.' });
        }
        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: userId, name: userData.name, email: userData.email, isAdmin: userData.isAdmin || false }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
