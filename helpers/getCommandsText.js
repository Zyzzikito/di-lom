export const getCommandsText = (commands) => {
  return `${commands
    .map((command) => {
      return `/${command.command} - ${command.description}`
    })
    .join('\n')}`
}
