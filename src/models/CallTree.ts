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
		console.log("\n=== Voice Agent Conversation Flows ===\n");
		this.printScenario(this.root, [], "");
	}

	private printScenario(
		node: CallNode,
		visited: string[],
		indent: string
	): void {
		// Avoid infinite loops
		if (visited.includes(node.id)) return;
		visited.push(node.id);

		// Print current node
		console.log(`${indent}🗣️  Agent: "${node.prompt}"`);

		// Print responses received for this node
		if (node.responses.length > 0) {
			node.responses.forEach((response) => {
				console.log(`${indent}👤  User: "${response}"`);
			});
		}

		// Print child scenarios
		if (node.children.length > 0) {
			node.children.forEach((child) => {
				console.log(`${indent}│`);
				this.printScenario(child, [...visited], indent + "  ");
			});
		}
	}
}
