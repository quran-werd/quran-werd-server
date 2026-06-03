import User from "../models/User";
import { verifyGoogleIdToken } from "./googleAuth.service";
import { generateToken } from "./jwt.service";

export const authenticateWithGoogle = async (idToken: string) => {
  const googleUser = await verifyGoogleIdToken(idToken);
  if (!googleUser) {
    return null;
  }

  let user = await User.findOne({ googleId: googleUser.googleId });

  if (!user) {
    user = await User.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
    });
  } else if (user.name !== googleUser.name || user.email !== googleUser.email) {
    user.name = googleUser.name;
    user.email = googleUser.email;
    await user.save();
  }

  const token = generateToken(user.id);

  return {
    token,
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
  };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
};
