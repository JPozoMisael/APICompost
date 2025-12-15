# Imagen base de Node
FROM node:20

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluye dev, para npm run dev)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Puerto que usa tu API (ajústalo si usas otro)
ENV PORT=3000
EXPOSE 3000

# Comando para iniciar la app (igual que tú usas en local)
CMD ["npm", "run", "dev"]
