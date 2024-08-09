import User, { IUser } from "../models/User";

export const addMemorizedRange = async (user_id: string, chapter_number: number, from: number, to: number): Promise<IUser | null> => {
  const user = await User.findById(user_id);

  if (!user) {
    console.log("User not found");
    return null;
  }

  // Access the chapter's memorization array or initialize it if it doesn't exist
  const memorization = user.memorizations[chapter_number] || [];

  // Update the memorization array for the chapter
  memorization.push({ from, to });

  // Set the updated memorization array for the chapter
  user.memorizations[chapter_number] = memorization;

  // Mark the `memorizations` field as modified
  user.markModified("memorizations");

  // Save the updated user document
  await user.save();

  // Save the updated user document
  try {
    await user.save();
    return user;
  } catch (error) {
    console.error("Error saving user:", error);
    return null;
  }
};

export const getMemorizationByChapterNumber = async (user_id: string, chapter_number: number): Promise<boolean> => {
  const user = await User.findById(user_id);

  if (!user) {
    console.log("User not found");
    return false;
  }

  return true;
};
