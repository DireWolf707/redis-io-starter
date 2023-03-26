import dotenv from "dotenv"
import getDirname from "../../utils/dirname.js"
import path from "path"

const dirname = getDirname(import.meta.url)

const getDotenvPath = () => {
  switch (process.env.NODE_ENV) {
    case "development":
      return path.join(dirname, "../../.env")

    case "preview":
      return path.join(dirname, "../../.env.prod")

    case "production":
      return "/etc/secrets/.env"
  }
}

dotenv.config({
  path: getDotenvPath(),
})
