export interface CallNode {
	id: string;
	prompt: string;
	children: CallNode[];
	visited: boolean;
	responses: string[];
}

export class CallTree {
	private root: CallNode;

	constructor(initialPrompt: string) {
		this.root = {
			id: "0",
			prompt: initialPrompt,
			children: [],
			visited: false,
			responses: [],
		};
	}

	public getRoot(): CallNode {
		return this.root;
	}

	public addResponse(nodeId: string, response: string): void {
		const node = this.findNode(nodeId);
		if (node) {
			node.responses.push(response);
		}
	}

	public addChild(parentId: string, childPrompt: string): string {
		const parent = this.findNode(parentId);
		if (!parent) {
			throw new Error(`Parent node ${parentId} not found`);
		}

		const childId = `${parentId}-${parent.children.length}`;
		const childNode: CallNode = {
			id: childId,
			prompt: childPrompt,
			children: [],
			visited: false,
			responses: [],
		};

		parent.children.push(childNode);
		return childId;
	}

	public markVisited(nodeId: string): void {
		const node = this.findNode(nodeId);
		if (node) {
			node.visited = true;
		}
	}

	public getNextUnvisitedNode(): CallNode | null {
		return this.findUnvisitedNode(this.root);
	}

	private findNode(id: string, node: CallNode = this.root): CallNode | null {
		if (node.id === id) {
			return node;
		}

		for (const child of node.children) {
			const found = this.findNode(id, child);
			if (found) {
				return found;
			}
		}

		return null;
	}

	private findUnvisitedNode(node: CallNode): CallNode | null {
		if (!node.visited) {
			return node;
		}

		for (const child of node.children) {
			const unvisited = this.findUnvisitedNode(child);
			if (unvisited) {
				return unvisited;
			}
		}

		return null;
	}

	public printTree(): void {
		this.printNode(this.root, 0);
	}

	private printNode(node: CallNode, level: number): void {
		const indent = "  ".repeat(level);
		console.log(`${indent}Node ${node.id}:`);
		console.log(`${indent}Prompt: ${node.prompt}`);
		console.log(`${indent}Visited: ${node.visited}`);
		console.log(`${indent}Responses: ${node.responses.join(", ")}`);

		for (const child of node.children) {
			this.printNode(child, level + 1);
		}
	}
}
