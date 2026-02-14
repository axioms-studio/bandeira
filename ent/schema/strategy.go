package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Strategy holds the schema definition for the Strategy entity.
type Strategy struct {
	ent.Schema
}

func (Strategy) Fields() []ent.Field {
	return []ent.Field{
		field.String("name"),
		field.JSON("parameters", map[string]interface{}{}).Optional(),
		field.Int("sort_order").Default(0),
		field.Int("flag_environment_id"),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Strategy) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("flag_environment", FlagEnvironment.Type).
			Ref("strategies").
			Field("flag_environment_id").
			Required().
			Unique(),
		edge.To("constraints", Constraint.Type),
	}
}
