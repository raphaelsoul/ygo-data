/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["typeorm", "sqlite3"],
    experimental: {
        esmExternals: true
    }
};

module.exports = nextConfig;
