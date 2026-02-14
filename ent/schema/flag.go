package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Flag holds the schema definition for the Flag entity.
type Flag struct {
	ent.Schema
}

func (Flag) Fields() []ent.Field {
	return []ent.Field{
		field.String("name"),
		field.String("description").Optional(),
		field.Enum("flag_type").Values("release", "experiment", "operational", "kill_switch"),
		field.Int("project_id"),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Flag) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("project", Project.Type).
			Ref("flags").
			Field("project_id").
			Required().
			Unique(),
		edge.To("flag_environments", FlagEnvironment.Type),
	}
}

func (Flag) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("name", "project_id").Unique(),
	}
}
