package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Environment holds the schema definition for the Environment entity.
type Environment struct {
	ent.Schema
}

func (Environment) Fields() []ent.Field {
	return []ent.Field{
		field.String("name"),
		field.Enum("type").Values("development", "staging", "production"),
		field.Int("sort_order").Default(0),
		field.Int("project_id"),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Environment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("project", Project.Type).
			Ref("environments").
			Field("project_id").
			Required().
			Unique(),
		edge.To("flag_environments", FlagEnvironment.Type),
	}
}

func (Environment) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("name", "project_id").Unique(),
	}
}
