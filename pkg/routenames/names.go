package routenames

const (
	Welcome    = "welcome"
	Strategies = "strategies"
	UserLogin  = "user.login"
	UserLogout = "user.logout"
	Dashboard  = "dashboard"
	Docs       = "docs"

	ProjectIndex  = "projects.index"
	ProjectCreate = "projects.create"
	ProjectStore  = "projects.store"
	ProjectShow   = "projects.show"
	ProjectEdit   = "projects.edit"
	ProjectUpdate = "projects.update"
	ProjectDelete = "projects.delete"

	EnvironmentCreate = "environments.create"
	EnvironmentStore  = "environments.store"
	EnvironmentEdit   = "environments.edit"
	EnvironmentUpdate = "environments.update"
	EnvironmentDelete = "environments.delete"

	FlagCreate = "flags.create"
	FlagStore  = "flags.store"
	FlagEdit   = "flags.edit"
	FlagUpdate = "flags.update"
	FlagDelete = "flags.delete"
	FlagToggle = "flags.toggle"

	StrategyList   = "flags.strategies"
	StrategyStore  = "flags.strategies.store"
	StrategyUpdate = "flags.strategies.update"
	StrategyDelete = "flags.strategies.delete"

	APIGetFlags = "api.flags"

	ApiTokenIndex  = "api_tokens.index"
	ApiTokenCreate = "api_tokens.create"
	ApiTokenStore  = "api_tokens.store"
	ApiTokenDelete = "api_tokens.delete"

	// Admin API
	AdminProjectList       = "api.admin.projects"
	AdminProjectCreate     = "api.admin.projects.create"
	AdminProjectGet        = "api.admin.projects.get"
	AdminProjectUpdate     = "api.admin.projects.update"
	AdminProjectDelete     = "api.admin.projects.delete"
	AdminEnvironmentList   = "api.admin.environments"
	AdminEnvironmentCreate = "api.admin.environments.create"
	AdminEnvironmentUpdate = "api.admin.environments.update"
	AdminEnvironmentDelete = "api.admin.environments.delete"
	AdminFlagList          = "api.admin.flags"
	AdminFlagCreate        = "api.admin.flags.create"
	AdminFlagGet           = "api.admin.flags.get"
	AdminFlagUpdate        = "api.admin.flags.update"
	AdminFlagDelete        = "api.admin.flags.delete"
	AdminFlagEnvPatch      = "api.admin.flags.env.patch"
	AdminTokenList         = "api.admin.tokens"
	AdminTokenCreate       = "api.admin.tokens.create"
	AdminTokenDelete       = "api.admin.tokens.delete"
)
