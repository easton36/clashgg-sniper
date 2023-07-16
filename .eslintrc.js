module.exports = {
	env: {
		browser: false,
		commonjs: true,
		es2021: true
	},
	extends: [
		'standard'
	],
	overrides: [],
	ignorePatterns: [
		'node_modules',
		'build',
		'package-lock.json',
		'package.json',
		'*.json',
		'logs/',
		'*.log',
		'*.prisma',
		'*.dbml',
		'*.sol'
	],
	parserOptions: {
		ecmaVersion: 'latest'
	},
	rules: {
		semi: [2, 'always'],
		'func-call-spacing': [2, 'never'],
		'keyword-spacing': [2, {
			before: false,
			after: false,
			overrides: {
				catch: {
					before: true,
					after: false
				},
				const: {
					before: false,
					after: true
				},
				return: {
					before: true,
					after: true
				},
				case: {
					before: false,
					after: true
				},
				else: {
					before: true,
					after: false
				},
				async: {
					before: false,
					after: true
				},
				of: {
					before: true,
					after: true
				},
				continue: {
					before: true,
					after: false
				},
				throw: {
					before: true,
					after: true
				},
				await: {
					before: true,
					after: true
				},
				break: {
					before: true,
					after: false
				},
				finally: {
					before: true,
					after: false
				}
			}
		}],
		'space-before-blocks': [2, 'never'],
		'newline-before-return': 2,
		'eol-last': [2, 'never'],
		indent: ['error', 'tab'],
		'no-tabs': 0,
		camelcase: 0,
		'prefer-regex-literals': 0,
		'no-useless-escape': 0,
		'no-unused-vars': 0,
		'n/no-callback-literal': 0,
		'space-before-function-paren': ['error', {
			anonymous: 'never',
			named: 'never',
			asyncArrow: 'always'
		}],
		'no-return-assign': 0
	}
};

/*
 Classes should use PascalCase
 Functions should use camelCase
 Variables should use camelCase
 Constants should use SCREAMING_SNAKE_CASE (only very important constants)
*/