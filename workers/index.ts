import { registry } from './registry'
import { WorkerRunner } from './runner'
import { emailHandler } from './handlers/email'
import { notificationHandler } from './handlers/notification'
import { reportHandler } from './handlers/report'
import { exportHandler } from './handlers/export'
import { importHandler } from './handlers/import'
import { aiGradingHandler } from './handlers/ai-grading'
import { paymentReconciliationHandler } from './handlers/payment-reconciliation'
import { cbtHandler } from './handlers/cbt'
import { cleanupHandler } from './handlers/cleanup'

// Register all system job handlers
registry.register('email', emailHandler)
registry.register('send_otp_email', emailHandler)
registry.register('send_welcome_email', emailHandler)
registry.register('notification', notificationHandler)
registry.register('notify_parent', notificationHandler)
registry.register('report', reportHandler)
registry.register('export', exportHandler)
registry.register('import', importHandler)
registry.register('ai-grading', aiGradingHandler)
registry.register('payment-reconciliation', paymentReconciliationHandler)
registry.register('cbt', cbtHandler)
registry.register('grade_cbt_submission', cbtHandler)
registry.register('cleanup', cleanupHandler)

export { registry, WorkerRunner }

export function createWorker(queue = 'default', pollIntervalMs = 2000) {
  return new WorkerRunner({ queue, pollIntervalMs })
}
