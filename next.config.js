/** @type {import('next').NextConfig} */

const repoName = "life-command-center"

const nextConfig = {
  // output: "export", // disabled locally (EBUSY on Windows); enabled via CI
  images: { unoptimized: true },
  trailingSlash: false,
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
}

module.exports = nextConfig
