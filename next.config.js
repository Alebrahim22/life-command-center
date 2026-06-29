/** @type {import('next').NextConfig} */

const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repoName = "life-command-center"

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  basePath: isGithubActions ? `/${repoName}` : "",
  assetPrefix: isGithubActions ? `/${repoName}/` : "",
}

module.exports = nextConfig
