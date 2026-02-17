package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// ApiToken holds the schema definition for the ApiToken entity.
type ApiToken struct {
	ent.Schema
}

func (ApiToken) Fields() []ent.Field {
	return []ent.Field{
		field.String("secret").Sensitive(),
		field.String("plain_token").Default(""),
		field.String("name"),
		field.Enum("token_type").Values("client", "admin"),
		field.String("environment").Optional(),
		field.Int("project_id"),
		field.Int("created_by").Optional().Nillable(),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (ApiToken) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("project", Project.Type).
			Ref("api_tokens").
			Field("project_id").
			Required().
			Unique(),
		edge.From("creator", User.Type).
			Ref("api_tokens").
			Field("created_by").
			Unique(),
	}
}
