# Use the official Node.js 20 image.
FROM node:20

# Create and change to the app directory.
WORKDIR /usr/src/app

# Since package.json and yarn.lock are inside the src directory, adjust the path accordingly
COPY src/package.json src/yarn.lock ./

# Install all dependencies. Ensure this command runs after the correct files are copied.
RUN yarn install

# Now copy the entire src directory into the current directory in the Docker image.
COPY src/ .

# Expose the port the app runs on
EXPOSE 3000

# Run the web service on container startup.
CMD ["node", "index.js"]
