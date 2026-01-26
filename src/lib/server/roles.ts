// role-based permissions
// hierarchy: user < tester < moderator < admin

export type Role = 'user' | 'tester' | 'moderator' | 'admin';

const ROLE_HIERARCHY: Role[] = ['user', 'tester', 'moderator', 'admin'];

// check if role has at least the required level
export function hasRole(userRole: string | null | undefined, required: Role): boolean {
	const role = (userRole as Role) || 'user';
	const userLevel = ROLE_HIERARCHY.indexOf(role);
	const requiredLevel = ROLE_HIERARCHY.indexOf(required);
	return userLevel >= requiredLevel;
}

// convenience checks
export function isAdmin(role: string | null | undefined): boolean {
	return hasRole(role, 'admin');
}

export function isModerator(role: string | null | undefined): boolean {
	return hasRole(role, 'moderator');
}

export function isTester(role: string | null | undefined): boolean {
	return hasRole(role, 'tester');
}
