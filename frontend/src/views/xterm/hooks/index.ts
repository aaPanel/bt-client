type ExecuteCommand = (val: string) => void

type Instance = {
	executeCommand: ExecuteCommand
	pasteEditArea: ExecuteCommand
	refreshVeiwPosition: () => void
	fileManagementPath: ExecuteCommand
}

const key = Symbol('fortress-terminal')

export function createContext(instance: Instance) {
	provide(key, instance)
}

export function useContext(): Instance {
	return inject(key) as Instance
}
