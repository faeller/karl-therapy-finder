export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by middleware - we can trust the request at this point
    // Admin user info is available in event.context.adminUser if needed
    
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      uptime: Math.floor(uptime),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }

  } catch (error: any) {
    console.error('❌ Failed to retrieve system metrics:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve system metrics'
    })
  }
})