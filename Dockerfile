FROM node:18-alpine

# Create the folder and set the permissions before switching users.
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

# Switch to the 'node' user so that the following commands do not run as root.
USER node

COPY --chown=node:node package*.json ./

RUN npm install

# Copy the rest of the code, ensuring that the owner is the user 'node'.
COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev"]