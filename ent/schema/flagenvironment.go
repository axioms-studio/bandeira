package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// FlagEnvironment holds the schema definition for the FlagEnvironment entity.
type FlagEnvironment struct {
	ent.Schema
}

func (FlagEnvironment) Fields() []ent.Field {
	return []ent.Field{
		field.Bool("enabled").Default(false),
		field.Int("flag_id"),
		field.Int("environment_id"),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (FlagEnvironment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("flag", Flag.Type).
			Ref("flag_environments").
			Field("flag_id").
			Required().
			Unique(),
		edge.From("environment", Environment.Type).
			Ref("flag_environments").
			Field("environment_id").
			Required().
			Unique(),
		edge.To("strategies", Strategy.Type),
	}
}

func (FlagEnvironment) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("flag_id", "environment_id").Unique(),
	}
}
