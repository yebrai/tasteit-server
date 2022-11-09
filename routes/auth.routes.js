const router = require("express").Router();
const bcrypt = require("bcryptjs");
const uploader = require("../middlewares/cloudinary.js");
const User = require("../models/User.model.js");


//* AUTHENTICATION ROUTES
// POST "/api/auth/signup" => registers a new user (receives user name, email and password from FE)
router.post("/signup", uploader.single("profileImage"), async (req, res, next) => {
  const { name, email, age, password, passwordConfirmation } = req.body;

  // Validation 1. Fields must not be empty
  if (!name || !email || !password) {
    res.status(400).json({ errorMessage: "Todos los campos deben ser rellenados" });
    return;
  }

  // Validation 2. Age value between 18 - 120
  if (age < 18) {
    res.status(400).json({ errorMessage: "Debes tener al menos 18 años" });
    return;
  }

  // Validation 3. Name should at least contain 3 characters
  if (name.length < 3) {
    res.status(400).json({ errorMessage: "El nombre de usuario debe tener al menos 3 carácteres" });
    return;
  }

  // Validation 4. Email format validation
  const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
  if (!emailRegex.test(email)) {
    res.status(400).json({ errorMessage: "Formato de correo electrónico incorrecto" });
    return;
  }

  // Validation 5. Password format validation
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ errorMessage: "La contraseña debe tener al menos 8 letras, una mayúscula y un número" });
    return;
  }

  // Validation 6. Double password confirmation
  if (password !== passwordConfirmation) {
    res.status(400).json({ errorMessage: "La contraseña debe ser igual que en el campo anterior"});
    return;
  }

  // Async
  try {
    // Validation 7: Email doesn't already exists in the DB
    const foundEmail = await User.findOne({ email });
    if (foundEmail !== null) {
      res.status(400).json({ errorMessage: "El email ya ha sido previamente registrado" });
      return;
    }

    // Password Encrypting
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      age,
      password: hashPassword,
      profileImage: req.file?.path,
    };

    // Create user in the DB
    await User.create(newUser)

    // Sends OK message to the FE
    res.status(201).json("Usuario registrado correctamente");

  } catch (error) {
    next(error);
  }
});

module.exports = router;