export function serializeUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    createdAt: user.createdAt,
  };
}

export function serializeContact(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    profilePic: user.profilePic,
  };
}
